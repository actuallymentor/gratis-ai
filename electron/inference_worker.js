/**
 * Inference worker — runs in an Electron utilityProcess so that heavy
 * native model loading and token generation never block the main process
 * (and therefore never freeze the UI).
 *
 * Communication is via structured messages on `process.parentPort`:
 *   → { id, type, payload }   (request from main)
 *   ← { id, type, payload }   (response back)
 *   ← { type: 'stream-token', payload }  (unsolicited stream events)
 *   ← { type: 'stream-done' }
 */

const os = require( `os` )

// ---------------------------------------------------
// Console forwarding — relay worker logs to the main
// process so they can reach the browser DevTools
// ---------------------------------------------------

const _serialise_arg = ( arg ) => {
    if( typeof arg === `object` ) try { return JSON.stringify( arg ) } catch { return String( arg ) }
    return String( arg )
}

for( const level of [ `log`, `info`, `warn`, `error`, `debug` ] ) {

    const original = console[ level ].bind( console )

    console[ level ] = ( ...args ) => {
        original( ...args )
        process.parentPort.postMessage( {
            type: `console-log`,
            payload: { level, message: args.map( _serialise_arg ).join( ` ` ) },
        } )
    }

}

// -------------------------------------------------------
// NativeInference — thin wrapper around node-llama-cpp
// -------------------------------------------------------

class NativeInference {

    constructor() {
        this._llama = null
        this._model = null
        this._context = null
        this._session = null
        this._model_path = null
        this._context_size = null
        this._abort_controller = null
    }

    /**
     * Load a GGUF model from disk.
     *
     * If the requested context size exceeds available VRAM, we retry with
     * progressively halved context sizes until it fits (floor: 2048).
     *
     * @param {string} model_path - Absolute path to the GGUF file
     * @param {Object} [opts] - Loading options
     * @param {number} [opts.n_ctx] - Context window size
     */
    async load( model_path, opts = {} ) {

        if( this._model ) await this.unload()

        // node-llama-cpp loaded lazily — heavy native dep
        const { getLlama, LlamaChatSession } = await import( `node-llama-cpp` )
        this._llama = await getLlama()

        this._model = await this._llama.loadModel( { modelPath: model_path } )

        // Try the requested context size, halving on VRAM failures.
        // Floor is 512 — tight but functional for short conversations.
        const MIN_CTX = 512
        let ctx_size = opts.n_ctx || 2048

        while( ctx_size >= MIN_CTX ) {

            try {

                this._context = await this._model.createContext( { contextSize: ctx_size } )
                this._session = new LlamaChatSession( { contextSequence: this._context.getSequence() } )
                this._model_path = model_path
                this._context_size = ctx_size
                return

            } catch ( err ) {

                const is_vram_error = /vram|memory|too large/i.test( err.message )

                if( !is_vram_error || ctx_size <= MIN_CTX ) {
                    // Not a VRAM issue, or we've already hit the floor — give up
                    await this._model.dispose()
                    this._model = null
                    throw err
                }

                // Halve and retry
                ctx_size = Math.max( MIN_CTX, Math.floor( ctx_size / 2 ) )

            }

        }

    }

    /**
     * Single-shot chat completion
     * @param {Array} messages - Chat messages
     * @param {Object} [opts] - Generation options
     * @returns {Promise<string>}
     */
    async chat( messages, opts = {} ) {

        if( !this._session ) throw new Error( `No model loaded` )

        const last_user_message = [ ...messages ].reverse().find( ( m ) => m.role === `user` )
        const prompt = last_user_message?.content || ``

        return this._session.prompt( prompt, {
            maxTokens: opts.max_tokens || 2048,
            temperature: opts.temperature || 0.7,
        } )

    }

    /**
     * Streaming chat completion — calls on_text for each text chunk
     * @param {Array} messages - Chat messages
     * @param {Object} opts - Generation options
     * @param {Function} on_text - Callback for each text chunk
     */
    async chat_stream( messages, opts, on_text ) {

        if( !this._session ) throw new Error( `No model loaded` )
        this._abort_controller = new AbortController()

        const last_user_message = [ ...messages ].reverse().find( ( m ) => m.role === `user` )
        const prompt = last_user_message?.content || ``

        try {

            await this._session.prompt( prompt, {
                maxTokens: opts.max_tokens || 2048,
                temperature: opts.temperature || 0.7,
                signal: this._abort_controller.signal,
                stopOnAbortSignal: true,
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

    /** Unload model and free native resources */
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
        this._context_size = null

    }

    is_loaded() {
        return !!this._model && !!this._session
    }

    get_model_id() {
        return this._model_path
    }

    /**
     * Gather system + GPU info via node-llama-cpp
     * @returns {Promise<Object>}
     */
    async get_system_info() {

        const info = {
            total_memory: os.totalmem(),
            free_memory: os.freemem(),
            cpus: os.cpus().length,
            platform: process.platform,
            arch: process.arch,
            gpu: {
                type: false,
                metal: false,
                cuda: false,
                vulkan: false,
                vram_total: 0,
                vram_free: 0,
                unified_memory: 0,
                device_names: [],
            },
        }

        try {

            const { getLlama } = await import( `node-llama-cpp` )
            const llama = await getLlama()

            const gpu_type = llama.gpu
            if( gpu_type ) info.gpu.type = gpu_type
            info.gpu.metal = gpu_type === `metal`
            info.gpu.cuda = gpu_type === `cuda`
            info.gpu.vulkan = gpu_type === `vulkan`

            const vram = await llama.getVramState()
            info.gpu.vram_total = vram.total || 0
            info.gpu.vram_free = vram.free || 0
            info.gpu.unified_memory = vram.unifiedSize || 0

            info.gpu.device_names = await llama.getGpuDeviceNames()

        } catch {

            // Fallback: Apple Silicon always has Metal
            if( process.platform === `darwin` && process.arch === `arm64` ) {
                info.gpu.type = `metal`
                info.gpu.metal = true
                info.gpu.unified_memory = os.totalmem()
            }

        }

        return info

    }

}

// -------------------------------------------------------
// Message dispatch — handle requests from main process
// -------------------------------------------------------

const provider = new NativeInference()

/** Send a message to the parent (main) process */
const send = ( msg ) => process.parentPort.postMessage( msg )

/** Handle a single request and return the result */
const handle_message = async ( { id, type, payload } ) => {

    try {

        let result

        switch( type ) {

            case `system:info`:
                result = await provider.get_system_info()
                break

            case `load`:
                await provider.load( payload.model_path, payload.opts )
                result = {
                    success: true,
                    context_size: provider._context_size,
                }
                break

            case `chat`:
                result = await provider.chat( payload.messages, payload.opts )
                break

            case `chat_stream`:
                await provider.chat_stream( payload.messages, payload.opts, ( text ) => {
                    send( { type: `stream-token`, payload: text } )
                } )
                send( { type: `stream-done` } )
                result = { success: true }
                break

            case `abort`:
                provider.abort()
                result = { success: true }
                break

            case `unload`:
                await provider.unload()
                result = { success: true }
                break

            case `status`:
                result = {
                    loaded: provider.is_loaded(),
                    model_id: provider.get_model_id(),
                }
                break

            case `shutdown`:
                // Graceful shutdown: cancel generation, free GPU/mmap, then exit
                provider.abort()
                await provider.unload()
                send( { id, type: `response`, payload: { success: true } } )
                process.exit( 0 )
                break

        default:
                throw new Error( `Unknown message type: ${ type }` )

        }

        send( { id, type: `response`, payload: result } )

    } catch ( err ) {
        send( { id, type: `error`, payload: err.message } )
    }

}

process.parentPort.on( `message`, ( { data } ) => handle_message( data ) )

// Safety net — last-chance cancellation if the process is killed without
// the shutdown message (e.g. SIGTERM). `exit` handlers must be synchronous.
process.on( `exit`, () => provider.abort() )
