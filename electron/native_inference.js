/**
 * Native LLM inference provider using node-llama-cpp
 * This is a placeholder — node-llama-cpp must be installed separately
 * as it requires native compilation for the target platform.
 *
 * The actual implementation would use:
 *   const { getLlama, LlamaChatSession } = require( 'node-llama-cpp' )
 */
class NativeInference {

    constructor() {
        this._model = null
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

            // node-llama-cpp dynamic import
            const { getLlama } = await import( `node-llama-cpp` )
            const llama = await getLlama()

            this._model = await llama.loadModel( { modelPath: model_path } )
            this._session = new llama.createContext( { model: this._model, contextSize: opts.n_ctx || 2048 } )
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

        // Build prompt from messages
        const prompt = messages.map( ( m ) => {
            if( m.role === `system` ) return `System: ${ m.content }`
            if( m.role === `user` ) return `User: ${ m.content }`
            return `Assistant: ${ m.content }`
        } ).join( `\n` ) + `\nAssistant:`

        const response = await this._session.prompt( prompt, {
            maxTokens: opts.max_tokens || 2048,
            temperature: opts.temperature || 0.7,
        } )

        return response

    }

    /**
     * Streaming chat completion with token callback
     * @param {Array} messages - Chat messages
     * @param {Object} opts - Generation options
     * @param {Function} on_token - Callback for each token
     * @returns {Promise<void>}
     */
    async chat_stream( messages, opts, on_token ) {

        if( !this._session ) throw new Error( `No model loaded` )
        this._abort_controller = new AbortController()

        const prompt = messages.map( ( m ) => {
            if( m.role === `system` ) return `System: ${ m.content }`
            if( m.role === `user` ) return `User: ${ m.content }`
            return `Assistant: ${ m.content }`
        } ).join( `\n` ) + `\nAssistant:`

        try {

            await this._session.prompt( prompt, {
                maxTokens: opts.max_tokens || 2048,
                temperature: opts.temperature || 0.7,
                signal: this._abort_controller.signal,
                onToken: ( token ) => {
                    if( on_token ) on_token( token )
                },
            } )

        } catch ( err ) {
            if( err.name !== `AbortError` ) throw err
        } finally {
            this._abort_controller = null
        }

    }

    /**
     * Abort current generation
     */
    abort() {
        if( this._abort_controller ) {
            this._abort_controller.abort()
            this._abort_controller = null
        }
    }

    /**
     * Unload the current model
     * @returns {Promise<void>}
     */
    async unload() {

        if( this._session ) {
            this._session = null
        }
        if( this._model ) {
            this._model = null
        }
        this._model_path = null

    }

    /**
     * Check if a model is loaded
     * @returns {boolean}
     */
    is_loaded() {
        return !!this._model && !!this._session
    }

    /**
     * Get the current model path
     * @returns {string|null}
     */
    get_model_id() {
        return this._model_path
    }

}

module.exports = { NativeInference }
