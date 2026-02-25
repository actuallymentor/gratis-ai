import { useState, useRef, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, RotateCcw } from 'lucide-react'
import ChatInput from '../molecules/ChatInput'
import VoiceModelDialog from '../molecules/VoiceModelDialog'
import use_llm from '../../hooks/use_llm'
import use_model_manager from '../../hooks/use_model_manager'
import use_voice_input from '../../hooks/use_voice_input'
import { DISPLAY_NAME, storage_key } from '../../utils/branding'

// ── Layout ──────────────────────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: ${ ( { theme } ) => theme.spacing.xl };
`

const Title = styled.h1`
    font-size: clamp( 2.5rem, 2rem + 3vw, 4rem );
    font-weight: 700;
    color: ${ ( { theme } ) => theme.colors.text };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
    letter-spacing: -0.02em;
`

const Tagline = styled.p`
    font-size: clamp( 1rem, 0.9rem + 0.3vw, 1.2rem );
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
`

// ── Model status ────────────────────────────────────────────────────

const ModelRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    min-height: 1.5rem;
`

const SwitchButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    font-size: 0.85rem;
    transition: color 0.15s;

    &:hover { color: ${ ( { theme } ) => theme.colors.text }; }
`

// ── Model dropdown (reused from ModelSelector pattern) ──────────────

const DropdownWrapper = styled.div`
    position: relative;
    display: inline-block;
`

const Dropdown = styled.div`
    position: absolute;
    bottom: calc( 100% + 4px );
    left: 50%;
    transform: translateX( -50% );
    min-width: 220px;
    max-height: min( 300px, 50vh );
    overflow-y: auto;
    background: ${ ( { theme } ) => theme.colors.background };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    box-shadow: ${ ( { theme } ) => theme.mode === `dark`
        ? `0 2px 8px rgba( 0, 0, 0, 0.3 )`
        : `0 2px 8px rgba( 0, 0, 0, 0.08 )` };
    z-index: 500;
`

const ModelOption = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    text-align: left;
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text };
    transition: background 0.15s;
    min-height: 2.75rem;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const ModelOptionName = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: ${ ( { $active } ) => $active ? 600 : 400 };
`

// ── Pulsing loading dot ─────────────────────────────────────────────

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
`

const LoadingDot = styled.span`
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme } ) => theme.colors.accent };
    animation: ${ pulse } 1.5s ease-in-out infinite;

    @media ( prefers-reduced-motion: reduce ) {
        animation: none;
    }
`

// ── Error banner ────────────────────────────────────────────────────

const ErrorBanner = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    background: ${ ( { theme } ) => theme.colors.error_background || `rgba( 200, 60, 60, 0.08 )` };
    color: ${ ( { theme } ) => theme.colors.error || `#b85c5c` };
    font-size: 0.85rem;
    max-width: 540px;
    width: 100%;
`

const ErrorAction = styled.button`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.accent };
    white-space: nowrap;
    transition: opacity 0.15s;

    &:hover { opacity: 0.7; }
`

// ── Component ───────────────────────────────────────────────────────

/**
 * Google-style search home for returning users.
 * Preloads the active model on mount so chat is instant.
 */
export default function HomePage() {

    const navigate = useNavigate()

    const [ show_dropdown, set_show_dropdown ] = useState( false )
    const dropdown_ref = useRef( null )

    const { load_model, is_loading, loaded_model_id } = use_llm()
    const { cached_models } = use_model_manager()

    const [ load_error, set_load_error ] = useState( null )

    // Voice input hook
    const {
        is_model_cached: is_voice_cached,
        is_downloading: is_voice_downloading,
        download_progress: voice_download_progress,
        is_recording,
        is_transcribing,
        is_loading_model: is_voice_loading_model,
        audio_level: voice_audio_level,
        recording_start_time: voice_recording_start_time,
        download_model: download_voice_model,
        start_recording,
        stop_and_transcribe,
    } = use_voice_input()

    // Voice dialog and transcription state
    const [ show_voice_dialog, set_show_voice_dialog ] = useState( false )
    const [ voice_download_error, set_voice_download_error ] = useState( false )
    const [ voice_text, set_voice_text ] = useState( null )

    // Resolve active model name for display
    const active_id = localStorage.getItem( storage_key( `active_model_id` ) )
    const active_model = cached_models.find( ( m ) => m.id === active_id )
    const model_name = active_model?.name || active_id || `Unknown`

    // ── Preload model on mount ──────────────────────────────────────

    useEffect( () => {

        if( !active_id ) return

        // Cleanup flag prevents the superseded first call (StrictMode double-mount)
        // from flashing the error banner before the real call completes
        let cancelled = false

        load_model( active_id ).catch( ( err ) => {
            if( cancelled ) return
            console.error( `[HomePage] Preload failed:`, err.message )
            set_load_error( err.message )
        } )

        return () => {
            cancelled = true
        }

    }, [] )

    // Clear stale error if the model loaded via a concurrent path
    // (e.g. StrictMode double-mount or navigation race)
    useEffect( () => {
        if( loaded_model_id && load_error ) set_load_error( null )
    }, [ loaded_model_id ] )

    // ── Close dropdown on outside click ─────────────────────────────

    useEffect( () => {

        if( !show_dropdown ) return

        const handle_click = ( e ) => {
            if( dropdown_ref.current && !dropdown_ref.current.contains( e.target ) ) {
                set_show_dropdown( false )
            }
        }

        const handle_escape = ( e ) => {
            if( e.key === `Escape` ) set_show_dropdown( false )
        }

        document.addEventListener( `mousedown`, handle_click )
        document.addEventListener( `keydown`, handle_escape )
        return () => {
            document.removeEventListener( `mousedown`, handle_click )
            document.removeEventListener( `keydown`, handle_escape )
        }

    }, [ show_dropdown ] )

    // ── Handlers ────────────────────────────────────────────────────

    const handle_send = useCallback( ( text ) => {
        navigate( `/chat?q=${ encodeURIComponent( text ) }` )
    }, [ navigate ] )

    // Retry loading after a transient failure
    const handle_retry = useCallback( () => {

        if( !active_id ) return

        set_load_error( null )
        load_model( active_id ).catch( ( err ) => {
            console.error( `[HomePage] Retry failed:`, err.message )
            set_load_error( err.message )
        } )

    }, [ active_id, load_model ] )

    const handle_switch = useCallback( ( model_id ) => {

        set_show_dropdown( false )

        if( model_id === active_id ) return

        localStorage.setItem( storage_key( `active_model_id` ), model_id )
        load_model( model_id ).catch( ( err ) => {
            console.error( `[HomePage] Model switch failed:`, err.message )
        } )

    }, [ active_id, load_model ] )

    // ── Voice input handlers ────────────────────────────────────────

    const handle_mic_click = useCallback( async () => {

        if( !is_voice_cached ) {
            set_show_voice_dialog( true )
            return
        }

        await start_recording()

    }, [ is_voice_cached, start_recording ] )

    const handle_mic_stop = useCallback( async () => {

        const text = await stop_and_transcribe()
        set_voice_text( null )
        if( text ) set_voice_text( text )

    }, [ stop_and_transcribe ] )

    const handle_voice_confirm = useCallback( async () => {

        set_voice_download_error( false )

        try {

            await download_voice_model()
            set_show_voice_dialog( false )
            await start_recording()

        } catch {
            set_voice_download_error( true )
        }

    }, [ download_voice_model, start_recording ] )

    const handle_voice_dialog_close = useCallback( () => {
        set_show_voice_dialog( false )
        set_voice_download_error( false )
    }, [] )

    // ── Render ──────────────────────────────────────────────────────

    return <Container>

        <Title>{ DISPLAY_NAME }</Title>
        <Tagline>
            Your own AI assistant that runs entirely on this device.
            Private, fast, and works offline.
        </Tagline>

        <ChatInput
            on_send={ handle_send }
            as_form
            max_width="540px"
            placeholder="Ask anything..."
            auto_focus
            on_mic_click={ handle_mic_click }
            on_mic_stop={ handle_mic_stop }
            is_recording={ is_recording }
            is_transcribing={ is_transcribing }
            is_loading_model={ is_voice_loading_model }
            audio_level={ voice_audio_level }
            recording_start_time={ voice_recording_start_time }
            append_text={ voice_text }
        />

        { /* Voice model download dialog */ }
        <VoiceModelDialog
            is_open={ show_voice_dialog }
            on_close={ handle_voice_dialog_close }
            on_confirm={ handle_voice_confirm }
            is_downloading={ is_voice_downloading }
            download_progress={ voice_download_progress }
            has_error={ voice_download_error }
            on_retry={ handle_voice_confirm }
        />

        { /* Model status row */ }
        <ModelRow>

            { is_loading && <>
                <LoadingDot />
                <span>Loading model...</span>
            </> }

            { !is_loading && loaded_model_id && <span>Ready</span> }

            { /* Switch model button with dropdown */ }
            { cached_models.length > 1 && <DropdownWrapper ref={ dropdown_ref }>
                <SwitchButton
                    onClick={ () => set_show_dropdown( !show_dropdown ) }
                    data-testid="home-switch-model"
                >
                    <RefreshCw size={ 12 } />
                    { model_name }
                </SwitchButton>

                { show_dropdown && <Dropdown>
                    { cached_models.map( ( m ) =>
                        <ModelOption
                            key={ m.id }
                            onClick={ () => handle_switch( m.id ) }
                            data-testid={ `home-model-option-${ m.id }` }
                        >
                            <ModelOptionName $active={ m.id === active_id }>
                                { m.name }
                            </ModelOptionName>
                        </ModelOption>
                    ) }
                </Dropdown> }
            </DropdownWrapper> }

            { /* Single model — just show the name */ }
            { cached_models.length === 1 && <span>{ model_name }</span> }

        </ModelRow>

        { /* Error banner — only after loading settles, never mid-load */ }
        { !is_loading && load_error && <ErrorBanner data-testid="home-load-error">
            <AlertCircle size={ 14 } />
            <span>Failed to load model</span>
            <ErrorAction onClick={ handle_retry } data-testid="home-retry-btn">
                <RotateCcw size={ 12 } /> Retry
            </ErrorAction>
            <ErrorAction onClick={ () => navigate( `/select-model` ) } data-testid="home-choose-another-btn">
                Choose another
            </ErrorAction>
        </ErrorBanner> }

    </Container>

}
