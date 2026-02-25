import { useState, useRef, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { SendHorizonal, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react'
import use_llm from '../../hooks/use_llm'
import use_model_manager from '../../hooks/use_model_manager'
import { DISPLAY_NAME, storage_key } from '../../utils/branding'

// ── Layout ──────────────────────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
`

const Title = styled.h1`
    font-size: clamp( 2.5rem, 2rem + 3vw, 4rem );
    font-weight: 700;
    color: ${ ( { theme } ) => theme.colors.text };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    letter-spacing: -0.02em;
`

// ── Search bar ──────────────────────────────────────────────────────

const SearchForm = styled.form`
    display: flex;
    align-items: flex-end;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    width: 100%;
    max-width: 540px;
`

const InputWrapper = styled.div`
    flex: 1;
    position: relative;
`

const TextArea = styled.textarea`
    width: 100%;
    min-height: 3rem;
    max-height: 200px;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    font-size: 1rem;
    line-height: 1.5;
    resize: none;
    font-family: inherit;

    &::placeholder {
        color: ${ ( { theme } ) => theme.colors.text_muted };
    }

    &:focus {
        outline: none;
        border-color: ${ ( { theme } ) => theme.colors.accent };
    }
`

const SubmitButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme } ) => theme.colors.primary };
    color: ${ ( { theme } ) => theme.colors.background };
    transition: opacity 0.15s;
    flex-shrink: 0;

    &:hover { opacity: 0.85; }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
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
    const textarea_ref = useRef( null )

    const [ query, set_query ] = useState( `` )
    const [ show_dropdown, set_show_dropdown ] = useState( false )
    const dropdown_ref = useRef( null )

    const { load_model, is_loading, loaded_model_id } = use_llm()
    const { cached_models } = use_model_manager()

    const [ load_error, set_load_error ] = useState( null )

    // Resolve active model name for display
    const active_id = localStorage.getItem( storage_key( `active_model_id` ) )
    const active_model = cached_models.find( ( m ) => m.id === active_id )
    const model_name = active_model?.name || active_id || `Unknown`

    // ── Preload model on mount ──────────────────────────────────────

    useEffect( () => {

        if( !active_id ) return

        // Don't nuke localStorage on failure — the user chose this model,
        // a transient WASM init failure shouldn't reset their preference
        load_model( active_id ).catch( ( err ) => {
            console.error( `[HomePage] Preload failed:`, err.message )
            set_load_error( err.message )
        } )

    }, [] )

    // ── Auto-focus the search input ─────────────────────────────────

    useEffect( () => {
        textarea_ref.current?.focus()
    }, [] )

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

    const handle_submit = useCallback( ( e ) => {

        e?.preventDefault()

        const trimmed = query.trim()
        if( !trimmed ) return

        navigate( `/chat?q=${ encodeURIComponent( trimmed ) }` )

    }, [ query, navigate ] )

    const handle_keydown = useCallback( ( e ) => {

        // Enter submits, Shift+Enter inserts newline
        if( e.key === `Enter` && !e.shiftKey ) {
            e.preventDefault()
            handle_submit()
        }

    }, [ handle_submit ] )

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

    // Auto-resize textarea
    const handle_input = useCallback( ( e ) => {

        set_query( e.target.value )

        // Reset then grow
        const el = e.target
        el.style.height = `auto`
        el.style.height = `${ el.scrollHeight }px`

    }, [] )

    // ── Render ──────────────────────────────────────────────────────

    return <Container>

        <Title>{ DISPLAY_NAME }</Title>

        <SearchForm onSubmit={ handle_submit } data-testid="home-search-form">

            <InputWrapper>
                <TextArea
                    ref={ textarea_ref }
                    value={ query }
                    onChange={ handle_input }
                    onKeyDown={ handle_keydown }
                    placeholder="Ask anything..."
                    rows={ 1 }
                    data-testid="home-search-input"
                />
            </InputWrapper>

            <SubmitButton
                type="submit"
                disabled={ !query.trim() }
                data-testid="home-search-submit"
                aria-label="Start chat"
            >
                <SendHorizonal size={ 18 } />
            </SubmitButton>

        </SearchForm>

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

        { /* Error banner — shown when model preload fails */ }
        { load_error && <ErrorBanner data-testid="home-load-error">
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
