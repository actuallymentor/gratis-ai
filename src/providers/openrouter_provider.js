/**
 * OpenRouter LLM Provider — implements the LLMProvider interface for cloud inference.
 *
 * Uses OpenRouter's OpenAI-compatible API for streaming chat completions.
 * No endpoint management, no warming, no GPU selection — just an API key and model ID.
 *
 * @module openrouter_provider
 */
import { log } from 'mentie'
import { openrouter_headers } from './openrouter_service'

const OPENROUTER_BASE = `https://openrouter.ai/api/v1`

/**
 * @implements {import('./types').LLMProvider}
 */
export default class OpenRouterProvider {

    /**
     * @param {Object} config
     * @param {string} config.api_key - OpenRouter API key
     * @param {string} config.model_id - OpenRouter model ID (e.g. `qwen/qwen3-30b-a3b`)
     */
    constructor( { api_key, model_id } ) {

        this._api_key = api_key
        this._model_id = model_id
        this._ready = false
        this._abort_controller = null

    }

    /**
     * "Load" the model — OpenRouter models are always available, no warming needed.
     */
    async load_model() {

        log.info( `[openrouter] Activating model ${ this._model_id }` )
        this._ready = true

    }

    /**
     * Non-streaming chat completion.
     *
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {Promise<string>}
     */
    async chat( messages, opts = {} ) {

        const body = this._build_request_body( messages, opts, false )

        const res = await fetch( `${ OPENROUTER_BASE }/chat/completions`, {
            method: `POST`,
            headers: openrouter_headers( this._api_key ),
            body: JSON.stringify( body ),
        } )

        if( !res.ok ) {
            const text = await res.text().catch( () => `` )
            throw new Error( `OpenRouter inference error (${ res.status }): ${ text }` )
        }

        const data = await res.json()
        return data.choices?.[ 0 ]?.message?.content || ``

    }

    /**
     * Streaming chat completion — yields tokens as they arrive via SSE.
     *
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {AsyncIterable<string>}
     */
    async *chat_stream( messages, opts = {} ) {

        this._abort_controller = new AbortController()

        const body = this._build_request_body( messages, opts, true )

        const res = await fetch( `${ OPENROUTER_BASE }/chat/completions`, {
            method: `POST`,
            headers: openrouter_headers( this._api_key ),
            body: JSON.stringify( body ),
            signal: this._abort_controller.signal,
        } )

        if( !res.ok ) {
            const text = await res.text().catch( () => `` )
            throw new Error( `OpenRouter inference error (${ res.status }): ${ text }` )
        }

        // Parse SSE stream
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ``

        try {

            while( true ) {

                const { done, value } = await reader.read()
                if( done ) break

                buffer += decoder.decode( value, { stream: true } )

                // Process complete SSE lines
                const lines = buffer.split( `\n` )
                buffer = lines.pop() // Keep incomplete line in buffer

                for( const line of lines ) {

                    const trimmed = line.trim()
                    if( !trimmed || !trimmed.startsWith( `data: ` ) ) continue

                    const payload = trimmed.slice( 6 )
                    if( payload === `[DONE]` ) break

                    try {
                        const chunk = JSON.parse( payload )
                        const content = chunk.choices?.[ 0 ]?.delta?.content
                        if( content ) yield content
                    } catch {
                        // Malformed chunk — skip
                    }

                }

            }

        } finally {

            reader.releaseLock()
            this._abort_controller = null

        }

    }

    /**
     * Abort current generation.
     */
    abort() {
        if( this._abort_controller ) {
            this._abort_controller.abort()
            this._abort_controller = null
        }
    }

    /**
     * Unload — no cleanup needed for OpenRouter.
     */
    async unload_model() {
        this._ready = false
    }

    /**
     * Get the loaded model identifier.
     * @returns {string | null}
     */
    get_loaded_model() {
        return this._ready ? `openrouter:${ this._model_id }` : null
    }

    /**
     * Check if the provider is ready for inference.
     * @returns {boolean}
     */
    is_ready() {
        return this._ready
    }


    // ── Private ──────────────────────────────────────────────────────────

    _build_request_body( messages, opts, stream ) {

        const body = {
            model: this._model_id,
            messages,
            stream,
            max_tokens: opts.max_tokens || 2048,
        }

        // Map generation options to OpenAI-compatible params
        if( opts.temperature != null ) body.temperature = opts.temperature
        if( opts.top_p != null ) body.top_p = opts.top_p
        if( opts.top_k != null ) body.top_k = opts.top_k
        if( opts.frequency_penalty != null ) body.frequency_penalty = opts.frequency_penalty
        if( opts.presence_penalty != null ) body.presence_penalty = opts.presence_penalty
        if( opts.repeat_penalty != null ) body.repetition_penalty = opts.repeat_penalty
        if( opts.min_p != null ) body.min_p = opts.min_p
        if( opts.stop_sequences?.length ) body.stop = opts.stop_sequences
        if( opts.seed != null && opts.seed !== -1 ) body.seed = opts.seed

        return body

    }

}
