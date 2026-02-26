const { app, BrowserWindow, ipcMain, utilityProcess } = require( `electron` )
const { autoUpdater } = require( `electron-updater` )
const path = require( `path` )
const fs = require( `fs` )

let main_window = null
let inference_worker = null
let active_download_controller = null

/* global __GITHUB_REPO__ */

// ---------------------------------------------------
// Inference worker bridge — spawns a utilityProcess
// so model loading + inference never block the UI
// ---------------------------------------------------

let _request_id = 0
const _pending = new Map()

/**
 * Spawn (or return existing) inference utilityProcess
 * @returns {Electron.UtilityProcess}
 */
const ensure_worker = () => {

    if( inference_worker ) return inference_worker

    inference_worker = utilityProcess.fork(
        path.join( __dirname, `inference_worker.js` ),
    )

    inference_worker.on( `message`, ( msg ) => {

        // Unsolicited stream events — forward straight to the renderer
        if( msg.type === `stream-token` ) {
            main_window?.webContents?.send( `llm:stream-token`, msg.payload )
            return
        }
        if( msg.type === `stream-done` ) {
            main_window?.webContents?.send( `llm:stream-done` )
            return
        }

        // Request/response — resolve or reject the matching promise
        const pending = _pending.get( msg.id )
        if( !pending ) return

        _pending.delete( msg.id )

        if( msg.type === `error` ) {
            pending.reject( new Error( msg.payload ) )
        } else {
            pending.resolve( msg.payload )
        }

    } )

    // If the worker crashes, clear state so it gets re-spawned on next call
    inference_worker.on( `exit`, () => {

        inference_worker = null

        // Reject any in-flight requests
        for( const [ , pending ] of _pending ) {
            pending.reject( new Error( `Inference worker exited unexpectedly` ) )
        }
        _pending.clear()

    } )

    return inference_worker

}

/**
 * Send a request to the inference worker and await the response
 * @param {string} type - Message type (load, chat, chat_stream, etc.)
 * @param {*} [payload] - Message payload
 * @returns {Promise<*>}
 */
const worker_request = ( type, payload ) => {

    return new Promise( ( resolve, reject ) => {

        const id = ++_request_id
        _pending.set( id, { resolve, reject } )
        ensure_worker().postMessage( { id, type, payload } )

    } )

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

    // System info — GPU detection runs in the worker to avoid blocking the UI
    // on the first getLlama() call (which compiles/loads native backends)
    ipcMain.handle( `system:info`, () => worker_request( `system:info` ) )

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

    // Load a model by ID — resolves the path here, sends to worker for loading
    ipcMain.handle( `llm:load`, async ( _event, model_id ) => {

        const manifest = read_manifest()
        const model = manifest.find( ( m ) => m.id === model_id )
        if( !model ) throw new Error( `Model not found: ${ model_id }` )

        const model_path = path.join( MODELS_DIR, model.file_name )
        if( !fs.existsSync( model_path ) ) throw new Error( `Model file missing: ${ model.file_name }` )

        await worker_request( `load`, {
            model_path,
            opts: { n_ctx: model.context_length || 2048 },
        } )

        // Update last_used_at
        model.last_used_at = Date.now()
        write_manifest( manifest )

        return { success: true }

    } )

    // Single-shot chat completion — forwarded to worker
    ipcMain.handle( `llm:chat`, ( _event, messages, opts ) => {
        return worker_request( `chat`, { messages, opts } )
    } )

    // Streaming chat — worker sends stream-token / stream-done events
    // which the message handler above forwards to the renderer
    ipcMain.handle( `llm:chat_stream`, ( _event, messages, opts ) => {
        return worker_request( `chat_stream`, { messages, opts } )
    } )

    // Abort current generation
    ipcMain.handle( `llm:abort`, () => worker_request( `abort` ) )

    // Unload the current model
    ipcMain.handle( `llm:unload`, () => worker_request( `unload` ) )

    // Get current model status
    ipcMain.handle( `llm:status`, () => worker_request( `status` ) )

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

// ---------------------------------------------------
// Auto-updater — checks GitHub Releases for new versions
// ---------------------------------------------------

const setup_auto_updater = () => {

    // Skip in dev — no packaged app to update
    if( !app.isPackaged ) return

    // Parse owner/repo from build-time define
    const repo = typeof __GITHUB_REPO__ !== `undefined` ? __GITHUB_REPO__ : ``
    const [ owner, name ] = repo.split( `/` )
    if( !owner || !name ) return

    autoUpdater.setFeedURL( {
        provider: `github`,
        owner,
        repo: name,
    } )

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    // Forward updater events to the renderer
    const send = ( channel, data ) => {
        main_window?.webContents?.send( channel, data )
    }

    autoUpdater.on( `update-available`, ( info ) => {
        send( `updater:available`, {
            version: info.version,
            release_notes: info.releaseNotes || ``,
        } )
    } )

    autoUpdater.on( `download-progress`, ( progress ) => {
        send( `updater:download-progress`, {
            percent: Math.round( progress.percent ),
            bytes_per_second: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total,
        } )
    } )

    autoUpdater.on( `update-downloaded`, ( info ) => {
        send( `updater:downloaded`, { version: info.version } )
    } )

    autoUpdater.on( `error`, ( err ) => {
        send( `updater:error`, { message: err?.message || `Update check failed` } )
    } )

    // IPC handlers for renderer-initiated actions
    ipcMain.handle( `updater:check`, () => autoUpdater.checkForUpdates() )
    ipcMain.handle( `updater:download`, () => autoUpdater.downloadUpdate() )
    ipcMain.handle( `updater:install`, () => autoUpdater.quitAndInstall() )

    // Auto-check 5 seconds after launch
    setTimeout( () => autoUpdater.checkForUpdates().catch( () => {} ), 5000 )

}

// App lifecycle
app.whenReady().then( () => {

    ensure_models_dir()
    register_ipc_handlers()
    create_window()
    setup_auto_updater()

    app.on( `activate`, () => {
        if( BrowserWindow.getAllWindows().length === 0 ) create_window()
    } )

} )

app.on( `window-all-closed`, () => {
    if( process.platform !== `darwin` ) app.quit()
} )
