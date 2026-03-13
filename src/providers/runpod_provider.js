/**
 * RunPod LLM Provider — implements the LLMProvider interface for cloud GPU inference.
 *
 * Uses RunPod's OpenAI-compatible vLLM endpoint for streaming chat completions.
 * The endpoint runs on serverless GPUs that scale to zero when idle.
 *
 * @module runpod_provider
 */
import { log } from 'mentie'
import { submit_job, get_endpoint_health } from './runpod_service'
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
     * @param {Function} [config.on_warming_change] - Called with (boolean) when warming state changes
     */
    constructor( { api_key, endpoint_id, model_name, daily_limit = 2, price_per_hr = 0, on_warming_change } ) {

        this._api_key = api_key
        this._endpoint_id = endpoint_id
        this._model_name = model_name
        this._daily_limit = daily_limit
        this._price_per_hr = price_per_hr
        this._on_warming_change = on_warming_change || ( () => {} )

        this._ready = false
        this._warming = false
        this._warming_interval = null
        this._abort_controller = null

    }

    /**
     * "Load" the model — fires a probe job to trigger worker spin-up,
     * then polls health until a worker is live.
     *
     * Marks ready immediately so the user can start typing — their messages
     * queue on RunPod's side and get picked up once a worker spins up.
     * The warming indicator shows in the chat UI until a worker is live.
     *
     * @param {string} _model_id - Unused (endpoint already knows its model)
     */
    async load_model( _model_id ) {

        log.info( `[runpod] Activating endpoint ${ this._endpoint_id } for ${ this._model_name }` )

        // Fire a lightweight probe job to trigger worker spin-up.
        // The job queues even if no worker is available yet — the queue entry
        // is what tells RunPod to spin up a worker.
        submit_job( this._api_key, this._endpoint_id, {
            messages: [ { role: `user`, content: `hi` } ],
            max_tokens: 1,
        } ).then( job => {
            log.info( `[runpod] Probe job submitted: ${ job.id } (${ job.status })` )
        } ).catch( err => {
            log.warn( `[runpod] Probe failed: ${ err.message }` )
        } )

        // Mark ready immediately — inference requests queue on RunPod's side
        this._ready = true

        // Start warming poll — checks health until a worker is live
        this._set_warming( true )
        this._start_warming_poll()

    }

    /**
     * Whether the endpoint is still warming up (no live workers yet).
     * @returns {boolean}
     */
    is_warming() {
        return this._warming
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
     * Unload — clears warming poll. Cloud endpoints scale to zero automatically.
     */
    async unload_model() {
        this._ready = false
        this._stop_warming_poll()
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

    _set_warming( value ) {
        if( this._warming === value ) return
        this._warming = value
        this._on_warming_change( value )
    }

    _start_warming_poll() {

        this._stop_warming_poll()

        const check = async () => {

            try {
                const health = await get_endpoint_health( this._api_key, this._endpoint_id )
                const { idle = 0, running = 0, initializing = 0, ready = 0 } = health?.workers || {}
                const live = idle + running + initializing + ready

                if( live > 0 ) {
                    log.info( `[runpod] Endpoint warm — ${ live } worker(s) live` )
                    this._set_warming( false )
                    this._stop_warming_poll()
                }
            } catch {
                // Health check can fail on brand-new endpoints — keep polling
            }

        }

        // Check immediately, then every 3 seconds
        check()
        this._warming_interval = setInterval( check, 3000 )

    }

    _stop_warming_poll() {
        if( this._warming_interval ) {
            clearInterval( this._warming_interval )
            this._warming_interval = null
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
