import { useState, useRef, useCallback, useEffect } from 'react'
import { create_provider } from '../providers/factory'

/**
 * React hook wrapping the LLM provider with state management
 * Tracks loading, generation, and stats
 *
 * @returns {Object} LLM hook state and actions
 */
export default function use_llm() {

    const provider_ref = useRef( null )
    // Single shared promise prevents TOCTOU race — StrictMode double-mount
    // can cause multiple concurrent ensure_provider() calls, each of which
    // would create a separate provider if we only check provider_ref
    const provider_promise_ref = useRef( null )
    const [ is_loading, set_is_loading ] = useState( false )
    const [ is_generating, set_is_generating ] = useState( false )
    const [ loaded_model_id, set_loaded_model_id ] = useState( null )
    const [ stats, set_stats ] = useState( null )
    const [ error, set_error ] = useState( null )

    /**
     * Ensure the provider is initialised (handles async creation)
     * Uses a shared promise so all concurrent callers get the same instance
     */
    const ensure_provider = useCallback( async () => {
        if( !provider_promise_ref.current ) {
            provider_promise_ref.current = create_provider()
        }
        const provider = await provider_promise_ref.current
        provider_ref.current = provider
        return provider
    }, [] )

    // Initialize provider on mount
    useEffect( () => {
        ensure_provider()
    }, [ ensure_provider ] )

    /**
     * Load a model by ID from IndexedDB
     * @param {string} model_id
     * @param {Function} [on_progress]
     */
    const load_model = useCallback( async ( model_id, on_progress ) => {

        const provider = await ensure_provider()

        set_is_loading( true )
        set_error( null )

        console.info( `[use_llm] Loading model: ${ model_id }` )

        try {
            await provider.load_model( model_id, on_progress )
            set_loaded_model_id( model_id )
            console.info( `[use_llm] Model loaded successfully: ${ model_id }` )
        } catch ( err ) {
            console.error( `[use_llm] Model load failed:`, err.message )
            set_error( err.message )
            throw err
        } finally {
            set_is_loading( false )
        }

    }, [ ensure_provider ] )

    /**
     * Send a chat message with streaming, returns full response text
     * @param {import('../providers/types').ChatMessage[]} messages
     * @param {import('../providers/types').GenerateOptions} [opts]
     * @param {Function} on_token - Called with each new token chunk
     * @returns {Promise<{ text: string, stats: import('../providers/types').GenerationStats }>}
     */
    const chat_stream = useCallback( async ( messages, opts, on_token ) => {

        if( !provider_ref.current || !provider_ref.current.is_ready() ) {
            throw new Error( `No model loaded` )
        }

        set_is_generating( true )
        set_stats( null )
        set_error( null )

        let full_text = ``
        let token_count = 0
        const start_time = performance.now()

        try {

            const stream = provider_ref.current.chat_stream( messages, opts )

            for await ( const chunk of stream ) {
                full_text += chunk
                token_count++

                // Throttle UI updates — call on_token but batch via requestAnimationFrame
                if( on_token ) on_token( full_text, chunk )
            }

            const elapsed_ms = performance.now() - start_time

            console.info( `[use_llm] Generation complete: ${ token_count } tokens in ${ elapsed_ms.toFixed( 0 ) }ms` )

            // When the model produces nothing, show a helpful message instead of "0 tokens"
            if( token_count === 0 && !full_text ) {
                full_text = `*The model returned an empty response. This can happen when the chat template is incompatible. Try a different model or check the browser console for details.*`
                if( on_token ) on_token( full_text )
            }

            const generation_stats = {
                tokens_generated: token_count,
                tokens_per_second: elapsed_ms > 0 ? token_count / ( elapsed_ms / 1000 ) : 0,
                elapsed_ms,
            }

            set_stats( generation_stats )
            return { text: full_text, stats: generation_stats }

        } catch ( err ) {
            if( err.name !== `AbortError` && !err.message?.includes( `abort` ) ) {
                console.error( `[use_llm] Generation error:`, err.message )
                set_error( err.message )
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
            set_is_generating( false )
        }

    }, [] )

    /**
     * Abort current generation
     */
    const abort = useCallback( () => {
        if( provider_ref.current ) provider_ref.current.abort()
    }, [] )

    /**
     * Unload current model
     */
    const unload_model = useCallback( async () => {
        if( provider_ref.current ) {
            await provider_ref.current.unload_model()
            set_loaded_model_id( null )
        }
    }, [] )

    /**
     * Check if model is ready for inference
     * @returns {boolean}
     */
    const is_ready = useCallback( () => {
        return provider_ref.current?.is_ready() || false
    }, [] )

    return {
        load_model,
        chat_stream,
        abort,
        unload_model,
        is_ready,
        is_loading,
        is_generating,
        loaded_model_id,
        stats,
        error,
    }

}
