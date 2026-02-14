import { Wllama } from '@wllama/wllama'
import { get_db } from '../stores/db'

// WASM paths relative to public/esm directory — wllama ships these
const CONFIG_PATHS = {
    'single-thread/wllama.wasm': new URL( `@wllama/wllama/esm/single-thread/wllama.wasm`, import.meta.url ).href,
    'multi-thread/wllama.wasm': new URL( `@wllama/wllama/esm/multi-thread/wllama.wasm`, import.meta.url ).href,
}

/**
 * Browser-based LLM provider using wllama (WASM llama.cpp)
 * Implements the LLMProvider interface from types.js
 */
export default class WllamaProvider {

    constructor() {
        this._wllama = null
        this._loaded_model_id = null
        this._abort_controller = null
    }

    /**
     * Load a GGUF model from IndexedDB cache
     * @param {string} model_id - The model ID in IndexedDB
     * @param {Function} [on_progress] - Progress callback
     * @returns {Promise<void>}
     */
    async load_model( model_id, on_progress ) {

        // Unload any existing model first
        if( this._wllama ) await this.unload_model()

        // Create new wllama instance
        this._wllama = new Wllama( CONFIG_PATHS, {
            suppressNativeLog: true,
        } )

        // Retrieve model blob from IndexedDB
        const db = await get_db()
        const cached = await db.get( `models`, model_id )

        if( !cached?.blob ) {
            throw new Error( `Model ${ model_id } not found in cache` )
        }

        // Report initial progress
        if( on_progress ) {
            on_progress( { progress: 0, status: `Loading model into memory...` } )
        }

        // Load from blob
        await this._wllama.loadModel( [ cached.blob ], {
            n_ctx: cached.context_length || 2048,
            n_batch: 512,
        } )

        this._loaded_model_id = model_id

        // Update last_used_at timestamp
        await db.put( `models`, { ...cached, last_used_at: Date.now() } )

        if( on_progress ) {
            on_progress( { progress: 1, status: `Model ready` } )
        }

    }

    /**
     * Single-shot chat completion
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {Promise<string>}
     */
    async chat( messages, opts = {} ) {

        if( !this._wllama || !this._wllama.isModelLoaded() ) {
            throw new Error( `No model loaded` )
        }

        const sampling = this._build_sampling( opts )

        const response = await this._wllama.createChatCompletion( messages, {
            nPredict: opts.max_tokens || 2048,
            sampling,
            stream: false,
        } )

        return response

    }

    /**
     * Streaming chat completion — yields tokens as they are generated
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {AsyncGenerator<string>}
     */
    async *chat_stream( messages, opts = {} ) {

        if( !this._wllama || !this._wllama.isModelLoaded() ) {
            throw new Error( `No model loaded` )
        }

        this._abort_controller = new AbortController()
        const sampling = this._build_sampling( opts )

        let last_text = ``

        const stream = await this._wllama.createChatCompletion( messages, {
            nPredict: opts.max_tokens || 2048,
            sampling,
            stream: true,
            abortSignal: this._abort_controller.signal,
        } )

        try {

            for await ( const chunk of stream ) {

                // Yield only the new portion of text
                const new_text = chunk.currentText || ``
                if( new_text.length > last_text.length ) {
                    yield new_text.slice( last_text.length )
                    last_text = new_text
                }

            }

        } catch ( err ) {
            // Don't re-throw abort errors
            if( err.name === `AbortError` || err.message?.includes( `abort` ) ) return
            throw err
        } finally {
            this._abort_controller = null
        }

    }

    /**
     * Abort any in-progress generation
     */
    abort() {
        if( this._abort_controller ) {
            this._abort_controller.abort()
            this._abort_controller = null
        }
    }

    /**
     * Unload the current model from memory
     * @returns {Promise<void>}
     */
    async unload_model() {

        if( this._wllama ) {
            try {
                await this._wllama.exit()
            } catch {
                // Ignore errors during cleanup
            }
            this._wllama = null
        }
        this._loaded_model_id = null

    }

    /**
     * Get the currently loaded model ID
     * @returns {string|null}
     */
    get_loaded_model() {
        return this._loaded_model_id
    }

    /**
     * Check if a model is loaded and ready
     * @returns {boolean}
     */
    is_ready() {
        return !!this._wllama && this._wllama.isModelLoaded()
    }

    /**
     * Build wllama sampling config from GenerateOptions
     * @param {import('./types').GenerateOptions} opts
     * @returns {Object} Wllama SamplingConfig
     */
    _build_sampling( opts ) {
        return {
            temp: opts.temperature ?? 0.7,
            top_p: opts.top_p ?? 0.95,
            top_k: opts.top_k ?? 40,
            min_p: opts.min_p ?? 0.05,
            penalty_repeat: opts.repeat_penalty ?? 1.1,
            penalty_last_n: opts.repeat_last_n ?? 64,
            penalty_freq: opts.frequency_penalty ?? 0,
            penalty_present: opts.presence_penalty ?? 0,
        }
    }

}
