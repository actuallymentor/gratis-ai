import { Wllama } from '@wllama/wllama'
import { get_db } from '../stores/db'

// WASM paths — served from public/wasm/ (copied there by postinstall script)
const CONFIG_PATHS = {
    'single-thread/wllama.wasm': `/wasm/single-thread/wllama.wasm`,
    'multi-thread/wllama.wasm': `/wasm/multi-thread/wllama.wasm`,
}

/**
 * Detect which chat template family a Jinja template belongs to.
 * Returns a string key used by format_chat_prompt to pick the right formatter.
 * @param {string} template - Jinja template from GGUF metadata
 * @returns {'zephyr' | 'chatml' | 'mistral' | 'llama3' | 'unknown'}
 */
const detect_template_type = ( template ) => {

    if( !template ) return `unknown`

    // Zephyr / TinyLlama — uses <|user|>, <|system|>, <|assistant|> with eos_token
    if( template.includes( `<|user|>` ) && template.includes( `eos_token` ) ) return `zephyr`

    // ChatML — uses <|im_start|> and <|im_end|>
    if( template.includes( `<|im_start|>` ) ) return `chatml`

    // Llama 3 — uses <|start_header_id|>
    if( template.includes( `<|start_header_id|>` ) ) return `llama3`

    // Mistral — uses [INST] and [/INST]
    if( template.includes( `[INST]` ) ) return `mistral`

    return `unknown`

}

/**
 * Manually format chat messages into a prompt string.
 * Bypasses wllama's formatChat which has a bug where eos_token
 * is not provided to the Jinja template engine, producing broken prompts.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} eos_token - The EOS token string (e.g., "</s>")
 * @param {string} bos_token - The BOS token string (e.g., "<s>")
 * @param {string} eot_token - The EOT (end-of-turn) token string (e.g., "<|eot_id|>")
 * @param {string} template_type - One of the detected template types
 * @returns {string} Formatted prompt ready for completion
 */
const format_chat_prompt = ( messages, eos_token, bos_token, eot_token, template_type ) => {

    let prompt = ``

    switch ( template_type ) {

    // Zephyr format — used by TinyLlama, Zephyr, StableLM
    case `zephyr`:
        for( const { role, content } of messages ) {
            prompt += `<|${ role }|>\n${ content }${ eos_token }`
        }
        prompt += `<|assistant|>\n`
        break

        // ChatML format — used by SmolLM2, Qwen, many fine-tunes
    case `chatml`:
        for( const { role, content } of messages ) {
            prompt += `<|im_start|>${ role }\n${ content }<|im_end|>\n`
        }
        prompt += `<|im_start|>assistant\n`
        break

        // Llama 3 format — uses header IDs
    case `llama3`:
        prompt += `<|begin_of_text|>`
        for( const { role, content } of messages ) {
            prompt += `<|start_header_id|>${ role }<|end_header_id|>\n\n${ content }${ eot_token }`
        }
        prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n`
        break

        // Mistral format — [INST] wrapping
    case `mistral`: {
        // Mistral puts system prompt before the first [INST] if present
        const system_msg = messages.find( m => m.role === `system` )
        const non_system = messages.filter( m => m.role !== `system` )
        // BOS only once at the start, not before every [INST]
        prompt += bos_token
        let turn_idx = 0

        for( const { role, content } of non_system ) {
            if( role === `user` ) {
                prompt += `[INST] `
                // Prepend system prompt to the first user message
                if( system_msg && turn_idx === 0 ) {
                    prompt += `${ system_msg.content }\n\n`
                }
                prompt += `${ content } [/INST]`
                turn_idx++
            } else if( role === `assistant` ) {
                prompt += ` ${ content }${ eos_token }`
            }
        }
        break
    }

    // Fallback — simple concatenation with role markers
    default:
        for( const { role, content } of messages ) {
            prompt += `### ${ role }:\n${ content }\n`
        }
        prompt += `### assistant:\n`
        break

    }

    return prompt

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
        this._template_type = `unknown`
        this._eos_str = `</s>`
        this._bos_str = `<s>`
        this._eot_str = ``
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

        // Use half the available cores for inference threads (wllama default)
        // On single-core devices this falls back to 1 thread gracefully
        const hw_threads = navigator.hardwareConcurrency || 1
        const n_threads = Math.max( 1, Math.floor( hw_threads / 2 ) )

        // Load from blob — larger batch size improves throughput in multi-threaded mode
        const file_size_mb = ( cached.blob.size / 1_000_000 ).toFixed( 0 )
        console.info( `[wllama] Loading model ${ model_id } (${ file_size_mb } MB, ${ n_threads } threads)` )

        try {

            await this._wllama.loadModel( [ cached.blob ], {
                n_ctx: cached.context_length || 2048,
                n_batch: n_threads > 1 ? 512 : 256,
                n_threads,
            } )

        } catch ( load_err ) {

            // WASM heap overflow produces a RangeError when the model is too large
            const is_memory_error = load_err instanceof RangeError
                || load_err.message?.includes( `memory` )
                || load_err.message?.includes( `out of bounds` )

            if( is_memory_error ) {
                console.error( `[wllama] Out of memory loading ${ model_id } (${ file_size_mb } MB)` )
                throw new Error( `This model is too large for your browser's memory. Try a smaller model or close other tabs.` )
            }

            console.error( `[wllama] Failed to load model:`, load_err )
            throw load_err

        }

        this._loaded_model_id = model_id

        // Verify the tokenizer works — some GGUF files (e.g. QuantFactory conversions)
        // have broken tokenizer data that crashes the WASM runtime. Catching this
        // early gives the user a clear message instead of silent 0-token outputs.
        try {
            const probe_tokens = await this._wllama.tokenize( `Hello`, true )
            if( !probe_tokens?.length ) throw new Error( `empty` )
        } catch {
            await this.unload_model()
            throw new Error( `This model file has an incompatible tokenizer. Please delete it and re-download.` )
        }

        // Detect the chat template type and cache EOS/BOS token strings
        // so we can format prompts ourselves (wllama's formatChat has a bug
        // where eos_token is not provided to the Jinja template engine)
        const template = this._wllama.getChatTemplate()
        this._template_type = detect_template_type( template )
        console.info( `[wllama] Detected template type: ${ this._template_type }` )

        // Get EOS and BOS token strings by detokenizing their IDs
        // detokenize returns Uint8Array so we need to decode to string
        const decoder = new TextDecoder()
        try {
            const eos_id = this._wllama.getEOS()
            const bos_id = this._wllama.getBOS()
            const eot_id = this._wllama.getEOT()
            if( eos_id >= 0 ) this._eos_str = decoder.decode( await this._wllama.detokenize( [ eos_id ] ) )
            if( bos_id >= 0 ) this._bos_str = decoder.decode( await this._wllama.detokenize( [ bos_id ] ) )
            if( eot_id >= 0 ) this._eot_str = decoder.decode( await this._wllama.detokenize( [ eot_id ] ) )
            console.info( `[wllama] Tokens — EOS: ${ JSON.stringify( this._eos_str ) }, BOS: ${ JSON.stringify( this._bos_str ) }, EOT: ${ JSON.stringify( this._eot_str ) }` )
        } catch ( token_err ) {
            console.warn( `[wllama] Could not resolve special tokens, using defaults`, token_err )
        }

        // Update last_used_at timestamp — non-critical, don't fail the load if storage is full
        try {
            await db.put( `models`, { ...cached, last_used_at: Date.now() } )
        } catch {
            console.warn( `[wllama] Could not update last_used_at (storage quota may be full)` )
        }

        if( on_progress ) {
            on_progress( { progress: 1, status: `Model ready` } )
        }

    }

    /**
     * Format chat messages into a prompt string.
     * Uses our own formatter to work around wllama's eos_token bug.
     * @param {Array<{role: string, content: string}>} messages
     * @returns {string} Formatted prompt
     */
    _format_chat( messages ) {
        return format_chat_prompt( messages, this._eos_str, this._bos_str, this._eot_str, this._template_type )
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
        const prompt = this._format_chat( messages )

        const response = await this._wllama.createCompletion( prompt, {
            nPredict: opts.max_tokens || 2048,
            sampling,
            stream: false,
        } )

        return response

    }

    /**
     * Streaming chat completion — yields tokens as they are generated.
     * Uses our own chat formatter + createCompletion for reliability.
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

        // Use our own chat formatter which correctly includes EOS/BOS tokens
        // (wllama's formatChat has a bug where eos_token is not provided to the Jinja engine)
        const prompt = this._format_chat( messages )
        console.debug( `[wllama] Prompt (${ this._template_type }):\n`, prompt )

        let last_text = ``
        let token_count = 0

        const stream = await this._wllama.createCompletion( prompt, {
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
                    token_count++
                }

            }

            // Warn when the model produced nothing — helps diagnose template issues
            if( token_count === 0 ) {
                console.warn( `[wllama] Model generated 0 tokens. Template type: ${ this._template_type }` )
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

        const sampling = {
            temp: opts.temperature ?? 0.7,
            top_p: opts.top_p ?? 0.95,
            top_k: opts.top_k ?? 40,
            min_p: opts.min_p ?? 0.05,
            penalty_repeat: opts.repeat_penalty ?? 1.1,
            penalty_last_n: opts.repeat_last_n ?? 64,
            penalty_freq: opts.frequency_penalty ?? 0,
            penalty_present: opts.presence_penalty ?? 0,
        }

        // Wire seed for reproducible outputs (-1 means random, omit it)
        if( opts.seed !== undefined && opts.seed !== -1 ) sampling.seed = opts.seed

        return sampling

    }

}
