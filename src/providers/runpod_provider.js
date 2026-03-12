/**
 * RunPod LLM Provider — implements the LLMProvider interface for cloud GPU inference.
 *
 * Uses RunPod's OpenAI-compatible vLLM endpoint for streaming chat completions.
 * The endpoint runs on serverless GPUs that scale to zero when idle.
 *
 * @module runpod_provider
 */
import { log } from 'mentie'
import { get_endpoint_health } from './runpod_service'
import { record_spend, is_over_limit, get_daily_spend } from './runpod_spend_tracker'

const INFERENCE_BASE = `https://api.runpod.ai/v2`

/**
 * @implements {import('./types').LLMProvider}
 */
export default class RunPodProvider {

    /**
     * @param {Object} config
     * @param {string} config.api_key - RunPod API key
     * @param {string} config.endpoint_id - Serverless endpoint ID
     * @param {string} config.model_name - HuggingFace model name (for the request body)
     * @param {number} [config.daily_limit=2] - Max daily spend in USD
     * @param {number} [config.price_per_hr=0] - GPU cost for spend tracking
     */
    constructor( { api_key, endpoint_id, model_name, daily_limit = 2, price_per_hr = 0 } ) {

        this._api_key = api_key
        this._endpoint_id = endpoint_id
        this._model_name = model_name
        this._daily_limit = daily_limit
        this._price_per_hr = price_per_hr

        this._ready = false
        this._abort_controller = null

    }

    /**
     * "Load" the model — polls the health endpoint until a worker is available.
     * Shows cold-start progress during the wait.
     *
     * @param {string} _model_id - Unused (endpoint already knows its model)
     * @param {Function} [on_progress] - Progress callback
     */
    async load_model( _model_id, on_progress ) {

        log.info( `[runpod] Waking endpoint ${ this._endpoint_id } for ${ this._model_name }` )

        if( on_progress ) {
            on_progress( { progress: 0.1, status: `Waking up cloud GPU...` } )
        }

        // Send a lightweight probe request to trigger worker spin-up
        try {
            await fetch( `${ INFERENCE_BASE }/${ this._endpoint_id }/openai/v1/models`, {
                headers: { Authorization: `Bearer ${ this._api_key }` },
            } )
        } catch {
            // Probe may fail if endpoint is cold — that's fine
        }

        // Poll health until at least one worker can serve requests.
        // RunPod reports workers as: idle, initializing, ready, running, throttled, unhealthy.
        // Any state except initializing and unhealthy means the worker can accept inference.
        const start = Date.now()
        const max_wait = 300_000 // 5 minutes max cold start

        while( Date.now() - start < max_wait ) {

            try {

                const health = await get_endpoint_health( this._api_key, this._endpoint_id )
                const workers = health.workers || {}
                const available = ( workers.idle || 0 ) + ( workers.running || 0 )
                    + ( workers.ready || 0 ) + ( workers.throttled || 0 )
                const initializing = workers.initializing || 0

                const elapsed = ( Date.now() - start ) / 1000
                const progress = Math.min( 0.95, 0.1 +  elapsed / ( max_wait / 1000 )  * 0.85 )

                if( on_progress ) {
                    on_progress( {
                        progress,
                        status: available > 0
                            ? `GPU ready — ${ available } worker${ available > 1 ? `s` : `` } active`
                            : initializing > 0
                                ? `GPU worker starting up... (${ Math.floor( elapsed ) }s)`
                                : `Waking up cloud GPU... (${ Math.floor( elapsed ) }s)`,
                    } )
                }

                if( available > 0 ) {
                    this._ready = true
                    if( on_progress ) on_progress( { progress: 1, status: `Ready` } )
                    log.info( `[runpod] Endpoint ${ this._endpoint_id } ready in ${ Math.floor( elapsed ) }s` )
                    return
                }

            } catch ( err ) {
                log.debug( `[runpod] Health poll error (will retry): ${ err.message }` )
            }

            await new Promise( r => setTimeout( r, 3000 ) )

        }

        // Timed out but mark as ready anyway — the first inference call
        // will trigger spin-up and the user will see the delay there
        this._ready = true
        if( on_progress ) on_progress( { progress: 1, status: `Ready (cold start may take a moment)` } )

    }

    /**
     * Non-streaming chat completion.
     *
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {Promise<string>}
     */
    async chat( messages, opts = {} ) {

        this._check_limits()

        const body = this._build_request_body( messages, opts, false )
        const start = performance.now()

        const res = await fetch( `${ INFERENCE_BASE }/${ this._endpoint_id }/openai/v1/chat/completions`, {
            method: `POST`,
            headers: {
                'Authorization': `Bearer ${ this._api_key }`,
                'Content-Type': `application/json`,
            },
            body: JSON.stringify( body ),
        } )

        if( !res.ok ) {
            const text = await res.text().catch( () => `` )
            throw new Error( `RunPod inference error (${ res.status }): ${ text }` )
        }

        const data = await res.json()
        const content = data.choices?.[ 0 ]?.message?.content || ``

        // Track spend
        const elapsed_s = ( performance.now() - start ) / 1000
        record_spend( elapsed_s, this._price_per_hr )

        return content

    }

    /**
     * Streaming chat completion — yields tokens as they arrive via SSE.
     *
     * @param {import('./types').ChatMessage[]} messages
     * @param {import('./types').GenerateOptions} [opts]
     * @returns {AsyncIterable<string>}
     */
    async *chat_stream( messages, opts = {} ) {

        this._check_limits()

        this._abort_controller = new AbortController()

        const body = this._build_request_body( messages, opts, true )
        const start = performance.now()

        const res = await fetch( `${ INFERENCE_BASE }/${ this._endpoint_id }/openai/v1/chat/completions`, {
            method: `POST`,
            headers: {
                'Authorization': `Bearer ${ this._api_key }`,
                'Content-Type': `application/json`,
            },
            body: JSON.stringify( body ),
            signal: this._abort_controller.signal,
        } )

        if( !res.ok ) {
            const text = await res.text().catch( () => `` )
            throw new Error( `RunPod inference error (${ res.status }): ${ text }` )
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

            // Track spend for the duration of the stream
            const elapsed_s = ( performance.now() - start ) / 1000
            record_spend( elapsed_s, this._price_per_hr )

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
     * Unload — no-op for cloud endpoints (they scale to zero automatically).
     */
    async unload_model() {
        this._ready = false
    }

    /**
     * Get the loaded model identifier.
     * @returns {string | null}
     */
    get_loaded_model() {
        return this._ready ? `runpod:${ this._endpoint_id }` : null
    }

    /**
     * Check if the provider is ready for inference.
     * @returns {boolean}
     */
    is_ready() {
        return this._ready
    }


    // ── Private ──────────────────────────────────────────────────────────

    _check_limits() {
        if( is_over_limit( this._daily_limit ) ) {
            throw new Error( `Daily spend limit reached ($${ get_daily_spend().toFixed( 2 ) } / $${ this._daily_limit })` )
        }
    }

    _build_request_body( messages, opts, stream ) {

        const body = {
            model: this._model_name,
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
