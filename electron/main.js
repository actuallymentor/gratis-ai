const { app, BrowserWindow, ipcMain } = require( `electron` )
const path = require( `path` )
const fs = require( `fs` )
const os = require( `os` )

let main_window = null
let native_provider = null
let active_download_controller = null

// ---------------------------------------------------
// Native inference provider using node-llama-cpp
// Inlined to avoid Rollup externalising the require
// ---------------------------------------------------

class NativeInference {

    constructor() {
        this._model = null
        this._context = null
        this._session = null
        this._model_path = null
        this._abort_controller = null
    }

    /**
     * Load a GGUF model from disk
     * @param {string} model_path - Absolute path to the GGUF file
     * @param {Object} [opts] - Loading options
     * @param {number} [opts.n_ctx] - Context window size
     * @returns {Promise<void>}
     */
    async load( model_path, opts = {} ) {

        // Unload any existing model
        if( this._model ) await this.unload()

        try {

            // node-llama-cpp loaded lazily — heavy native dep
            const { getLlama, LlamaChatSession } = await import( `node-llama-cpp` )
            const llama = await getLlama()

            this._model = await llama.loadModel( { modelPath: model_path } )

            // createContext is a method on the model, not on llama
            this._context = await this._model.createContext( { contextSize: opts.n_ctx || 2048 } )

            // LlamaChatSession wraps a context sequence and manages chat history
            this._session = new LlamaChatSession( { contextSequence: this._context.getSequence() } )

            this._model_path = model_path

        } catch ( err ) {
            throw new Error( `Failed to load model: ${ err.message }` )
        }

    }

    /**
     * Single-shot chat completion
     * @param {Array} messages - Chat messages
     * @param {Object} [opts] - Generation options
     * @returns {Promise<string>} Generated text
     */
    async chat( messages, opts = {} ) {

        if( !this._session ) throw new Error( `No model loaded` )

        // Extract the last user message — LlamaChatSession manages history internally
        const last_user_message = [ ...messages ].reverse().find( ( m ) => m.role === `user` )
        const prompt = last_user_message?.content || ``

        const response = await this._session.prompt( prompt, {
            maxTokens: opts.max_tokens || 2048,
            temperature: opts.temperature || 0.7,
        } )

        return response

    }

    /**
     * Streaming chat completion with text chunk callback
     * @param {Array} messages - Chat messages
     * @param {Object} opts - Generation options
     * @param {Function} on_text - Callback for each text chunk
     * @returns {Promise<void>}
     */
    async chat_stream( messages, opts, on_text ) {

        if( !this._session ) throw new Error( `No model loaded` )
        this._abort_controller = new AbortController()

        // Extract the last user message — LlamaChatSession manages history internally
        const last_user_message = [ ...messages ].reverse().find( ( m ) => m.role === `user` )
        const prompt = last_user_message?.content || ``

        try {

            await this._session.prompt( prompt, {
                maxTokens: opts.max_tokens || 2048,
                temperature: opts.temperature || 0.7,
                signal: this._abort_controller.signal,
                stopOnAbortSignal: true,
                // onTextChunk sends decoded strings (not raw token IDs)
                onTextChunk: ( text ) => {
                    if( on_text ) on_text( text )
                },
            } )

        } catch ( err ) {
            if( err.name !== `AbortError` ) throw err
        } finally {
            this._abort_controller = null
        }

    }

    /** Abort current generation */
    abort() {
        if( this._abort_controller ) {
            this._abort_controller.abort()
            this._abort_controller = null
        }
    }

    /**
     * Unload the current model and dispose native resources
     * @returns {Promise<void>}
     */
    async unload() {

        if( this._session ) {
            this._session.dispose()
            this._session = null
        }

        if( this._context ) {
            await this._context.dispose()
            this._context = null
        }

        if( this._model ) {
            await this._model.dispose()
            this._model = null
        }

        this._model_path = null

    }

    /** @returns {boolean} */
    is_loaded() {
        return !!this._model && !!this._session
    }

    /** @returns {string|null} */
    get_model_id() {
        return this._model_path
    }

}

// Models directory in user data
const MODELS_DIR = path.join( app.getPath( `userData` ), `models` )
const MANIFEST_PATH = path.join( MODELS_DIR, `models_manifest.json` )

/**
 * Ensure the models directory and manifest exist
 */
const ensure_models_dir = () => {

    if( !fs.existsSync( MODELS_DIR ) ) {
        fs.mkdirSync( MODELS_DIR, { recursive: true } )
    }

    if( !fs.existsSync( MANIFEST_PATH ) ) {
        fs.writeFileSync( MANIFEST_PATH, JSON.stringify( [], null, 2 ) )
    }

}

/**
 * Read the models manifest
 * @returns {Array} Array of model metadata objects
 */
const read_manifest = () => {

    try {
        return JSON.parse( fs.readFileSync( MANIFEST_PATH, `utf-8` ) )
    } catch {
        return []
    }

}

/**
 * Write the models manifest
 * @param {Array} manifest - Array of model metadata objects
 */
const write_manifest = ( manifest ) => {
    fs.writeFileSync( MANIFEST_PATH, JSON.stringify( manifest, null, 2 ) )
}

/**
 * Create the main application window
 */
const create_window = () => {

    main_window = new BrowserWindow( {
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join( __dirname, `../preload/preload.cjs` ),
            contextIsolation: true,
            nodeIntegration: false,
        },
    } )

    // Load the renderer
    if( process.env.NODE_ENV === `development` ) {
        main_window.loadURL( `http://localhost:5173` )
    } else {
        main_window.loadFile( path.join( __dirname, `../renderer/index.html` ) )
    }

}

/**
 * Register all IPC handlers for LLM operations
 */
const register_ipc_handlers = () => {

    // Return real system info for device detection
    ipcMain.handle( `system:info`, () => ( {
        total_memory: os.totalmem(),
        free_memory: os.freemem(),
        cpus: os.cpus().length,
        platform: process.platform,
        arch: process.arch,
    } ) )

    // Save a downloaded model to the filesystem
    ipcMain.handle( `llm:save_model`, async ( _event, { id, file_name, array_buffer, metadata } ) => {

        ensure_models_dir()

        // Write the GGUF file with explicit fsync to ensure data is flushed
        // before node-llama-cpp mmap()s the file
        const model_path = path.join( MODELS_DIR, file_name )
        const buffer = Buffer.from( array_buffer )
        let fd
        try {
            fd = fs.openSync( model_path, 'w', 0o644 )
            fs.writeSync( fd, buffer, 0, buffer.length )
            fs.fsyncSync( fd )
        } finally {
            if( fd !== undefined ) fs.closeSync( fd )
        }

        // Verify the written file matches expected size
        const written_size = fs.statSync( model_path ).size
        if( written_size !== buffer.length ) {
            throw new Error( `Model file size mismatch: expected ${ buffer.length } bytes, wrote ${ written_size }` )
        }

        // Update manifest
        const manifest = read_manifest()
        const now = Date.now()

        // Remove existing entry if present (re-download)
        const existing_index = manifest.findIndex( ( m ) => m.id === id )
        if( existing_index !== -1 ) manifest.splice( existing_index, 1 )

        manifest.push( {
            ...metadata,
            id,
            file_name,
            file_size_bytes: array_buffer.byteLength,
            cached_at: now,
            last_used_at: now,
        } )

        write_manifest( manifest )

        return { success: true }

    } )

    // Download a model by streaming directly to disk — avoids buffering
    // the entire file in renderer memory (which fails for large models)
    ipcMain.handle( `llm:download_model`, async ( _event, { url, id, file_name, metadata, expected_size } ) => {

        ensure_models_dir()

        active_download_controller = new AbortController()
        const model_path = path.join( MODELS_DIR, file_name )

        try {

            const response = await fetch( url, { signal: active_download_controller.signal } )
            if( !response.ok ) throw new Error( `Download failed: ${ response.status } ${ response.statusText }` )

            const content_length = parseInt( response.headers.get( `content-length` ) ) || expected_size || 0
            const reader = response.body.getReader()
            let bytes_loaded = 0
            let last_progress_time = 0

            // Stream chunks directly to disk — never holds the full file in memory
            let fd
            try {

                fd = fs.openSync( model_path, `w`, 0o644 )

                while( true ) {

                    const { done, value } = await reader.read()
                    if( done ) break

                    fs.writeSync( fd, value )
                    bytes_loaded += value.byteLength

                    // Throttle progress events to ~4 updates/sec
                    const now = Date.now()
                    if( now - last_progress_time >= 250 ) {
                        last_progress_time = now
                        main_window?.webContents?.send( `llm:download-progress`, {
                            progress: content_length > 0 ? bytes_loaded / content_length : 0,
                            bytes_loaded,
                            bytes_total: content_length,
                            status: `Downloading...`,
                        } )
                    }

                }

                fs.fsyncSync( fd )

            } finally {
                if( fd !== undefined ) fs.closeSync( fd )
            }

            // Verify written size matches expected
            const written_size = fs.statSync( model_path ).size
            if( content_length > 0 && written_size !== content_length ) {
                fs.unlinkSync( model_path )
                throw new Error( `Size mismatch: expected ${ content_length }, wrote ${ written_size }` )
            }

            // Update manifest
            const manifest = read_manifest()
            const now = Date.now()
            const existing_index = manifest.findIndex( ( m ) => m.id === id )
            if( existing_index !== -1 ) manifest.splice( existing_index, 1 )

            manifest.push( {
                ...metadata,
                id,
                file_name,
                file_size_bytes: written_size,
                cached_at: now,
                last_used_at: now,
            } )

            write_manifest( manifest )

            // Final progress event
            main_window?.webContents?.send( `llm:download-progress`, {
                progress: 1,
                bytes_loaded: written_size,
                bytes_total: written_size,
                status: `Complete`,
            } )

            return { success: true }

        } catch( err ) {
            // Clean up partial file on failure
            if( fs.existsSync( model_path ) ) fs.unlinkSync( model_path )
            throw err
        } finally {
            active_download_controller = null
        }

    } )

    // Abort an in-progress download
    ipcMain.handle( `llm:abort_download`, async () => {

        if( active_download_controller ) {
            active_download_controller.abort()
            active_download_controller = null
        }
        return { success: true }

    } )

    // Load a model by ID from the models directory
    ipcMain.handle( `llm:load`, async ( _event, model_id ) => {

        const manifest = read_manifest()
        const model = manifest.find( ( m ) => m.id === model_id )
        if( !model ) throw new Error( `Model not found: ${ model_id }` )

        const model_path = path.join( MODELS_DIR, model.file_name )
        if( !fs.existsSync( model_path ) ) throw new Error( `Model file missing: ${ model.file_name }` )

        // Instantiate native provider on first use
        if( !native_provider ) {
            native_provider = new NativeInference()
        }

        await native_provider.load( model_path, {
            n_ctx: model.context_length || 2048,
        } )

        // Update last_used_at
        model.last_used_at = Date.now()
        write_manifest( manifest )

        return { success: true }

    } )

    // Single-shot chat completion
    ipcMain.handle( `llm:chat`, async ( _event, messages, opts ) => {

        if( !native_provider?.is_loaded() ) throw new Error( `No model loaded` )
        return native_provider.chat( messages, opts )

    } )

    // Streaming chat completion
    ipcMain.handle( `llm:chat_stream`, async ( _event, messages, opts ) => {

        if( !native_provider?.is_loaded() ) throw new Error( `No model loaded` )

        // Send text chunks to renderer via events, await completion, then signal done
        await native_provider.chat_stream( messages, opts, ( text ) => {
            main_window?.webContents?.send( `llm:stream-token`, text )
        } )

        main_window?.webContents?.send( `llm:stream-done` )

        return { success: true }

    } )

    // Abort current generation
    ipcMain.handle( `llm:abort`, async () => {

        if( native_provider ) native_provider.abort()
        return { success: true }

    } )

    // Unload the current model
    ipcMain.handle( `llm:unload`, async () => {

        if( native_provider ) await native_provider.unload()
        return { success: true }

    } )

    // Get current model status
    ipcMain.handle( `llm:status`, async () => {

        return {
            loaded: native_provider?.is_loaded() || false,
            model_id: native_provider?.get_model_id() || null,
        }

    } )

    // List all cached models
    ipcMain.handle( `llm:list_models`, async () => {

        return read_manifest()

    } )

    // Delete a model
    ipcMain.handle( `llm:delete_model`, async ( _event, model_id ) => {

        const manifest = read_manifest()
        const index = manifest.findIndex( ( m ) => m.id === model_id )
        if( index === -1 ) throw new Error( `Model not found` )

        const model = manifest[ index ]
        const model_path = path.join( MODELS_DIR, model.file_name )

        // Remove from manifest
        manifest.splice( index, 1 )
        write_manifest( manifest )

        // Delete file
        if( fs.existsSync( model_path ) ) {
            fs.unlinkSync( model_path )
        }

        return { success: true }

    } )

}

// App lifecycle
app.whenReady().then( () => {

    ensure_models_dir()
    register_ipc_handlers()
    create_window()

    app.on( `activate`, () => {
        if( BrowserWindow.getAllWindows().length === 0 ) create_window()
    } )

} )

app.on( `window-all-closed`, () => {
    if( process.platform !== `darwin` ) app.quit()
} )
