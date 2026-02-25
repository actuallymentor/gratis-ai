import { create } from 'zustand'
import { create_provider } from '../providers/factory'

/**
 * Shared LLM state store — singleton across all pages.
 *
 * Both HomePage (preload) and ChatPage (inference) share the same
 * provider instance and loading state, preventing duplicate model loads
 * when navigating between pages.
 */
const use_llm_store = create( ( set, get ) => ( {

    // ── State ────────────────────────────────────────────────────────

    is_loading: false,
    is_generating: false,
    loaded_model_id: null,
    stats: null,
    error: null,

    // ── Internal (not consumed by UI) ────────────────────────────────

    _provider: null,
    _provider_promise: null,
    _load_promise: null,
    _loading_model_id: null,

    // ── Actions ──────────────────────────────────────────────────────

    /**
     * Ensure the provider is initialised (handles async creation).
     * Uses a shared promise so all concurrent callers get the same instance.
     */
    ensure_provider: async () => {

        const state = get()

        if( state._provider ) return state._provider

        if( !state._provider_promise ) {
            const promise = create_provider()
            set( { _provider_promise: promise } )
        }

        const provider = await get()._provider_promise
        set( { _provider: provider } )
        return provider

    },

    /**
     * Load a model by ID, with deduplication.
     * If a load for the same model is already in-flight, returns
     * the existing promise instead of starting a new one.
     *
     * @param {string} model_id
     * @param {Function} [on_progress]
     * @returns {Promise<void>}
     */
    load_model: async ( model_id, on_progress ) => {

        const state = get()

        // Already loaded — nothing to do
        if( state.loaded_model_id === model_id && !state.is_loading ) return

        // Already loading this exact model — return existing promise
        if( state._load_promise && state._loading_model_id === model_id ) {
            return state._load_promise
        }

        const promise = ( async () => {

            const provider = await get().ensure_provider()

            set( { is_loading: true, error: null, _loading_model_id: model_id } )

            console.info( `[use_llm] Loading model: ${ model_id }` )

            try {
                await provider.load_model( model_id, on_progress )
                set( { loaded_model_id: model_id } )
                console.info( `[use_llm] Model loaded successfully: ${ model_id }` )
            } catch ( err ) {
                console.error( `[use_llm] Model load failed:`, err.message )
                set( { error: err.message } )
                throw err
            } finally {
                set( { is_loading: false, _load_promise: null, _loading_model_id: null } )
            }

        } )()

        set( { _load_promise: promise } )
        return promise

    },

    /**
     * Stream a chat completion.
     * Manages is_generating flag and accumulates stats.
     *
     * @param {Array} messages
     * @param {Object} [opts]
     * @param {Function} on_token - Called with ( full_text, chunk )
     * @returns {Promise<{ text: string, stats: Object }>}
     */
    chat_stream: async ( messages, opts, on_token ) => {

        const provider = get()._provider

        if( !provider || !provider.is_ready() ) {
            throw new Error( `No model loaded` )
        }

        set( { is_generating: true, stats: null, error: null } )

        let full_text = ``
        let token_count = 0
        const start_time = performance.now()

        try {

            const stream = provider.chat_stream( messages, opts )

            for await ( const chunk of stream ) {
                full_text += chunk
                token_count++
                if( on_token ) on_token( full_text, chunk )
            }

            const elapsed_ms = performance.now() - start_time

            console.info( `[use_llm] Generation complete: ${ token_count } tokens in ${ elapsed_ms.toFixed( 0 ) }ms` )

            // When the model produces nothing, show a helpful message
            if( token_count === 0 && !full_text ) {
                full_text = `*The model returned an empty response. This can happen when the chat template is incompatible. Try a different model or check the browser console for details.*`
                if( on_token ) on_token( full_text )
            }

            const generation_stats = {
                tokens_generated: token_count,
                tokens_per_second: elapsed_ms > 0 ? token_count / ( elapsed_ms / 1000 ) : 0,
                elapsed_ms,
            }

            set( { stats: generation_stats } )
            return { text: full_text, stats: generation_stats }

        } catch ( err ) {

            if( err.name !== `AbortError` && !err.message?.includes( `abort` ) ) {
                console.error( `[use_llm] Generation error:`, err.message )
                set( { error: err.message } )
            }

            const elapsed_ms = performance.now() - start_time
            return {
                text: full_text,
                stats: {
                    tokens_generated: token_count,
                    tokens_per_second: token_count / ( elapsed_ms / 1000 ),
                    elapsed_ms,
                },
            }

        } finally {
            set( { is_generating: false } )
        }

    },

    /**
     * Abort current generation
     */
    abort: () => {
        const provider = get()._provider
        if( provider ) provider.abort()
    },

    /**
     * Unload the current model
     */
    unload_model: async () => {
        const provider = get()._provider
        if( provider ) {
            await provider.unload_model()
            set( { loaded_model_id: null } )
        }
    },

    /**
     * Check if the provider is ready for inference
     * @returns {boolean}
     */
    is_ready: () => {
        return get()._provider?.is_ready() || false
    },

} ) )

export default use_llm_store
