/**
 * Cloud model setup wizard — connect to OpenRouter or Venice for cloud inference.
 *
 * Route receives `?provider=openrouter` or `?provider=venice` query param.
 * Simple flow: enter API key → click Connect. Default model is Dolphin Mistral 24B.
 * Advanced settings (model override, system prompt, daily limit) are collapsed by default.
 *
 * Works in both Electron and browser — both OpenRouter and Venice support CORS.
 */
import { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cloud, LoaderCircle, AlertTriangle, Check, ArrowRight, List, ChevronDown } from 'lucide-react'
import use_openrouter_store from '../../stores/openrouter_store'
import use_venice_store from '../../stores/venice_store'
import { validate_api_key as validate_openrouter_key, fetch_models as fetch_openrouter_models } from '../../providers/openrouter_service'
import { validate_api_key as validate_venice_key, fetch_models as fetch_venice_models } from '../../providers/venice_service'
import { storage_key } from '../../utils/branding'
import SuggestedModelsModal from '../molecules/SuggestedModelsModal'


// ─── Defaults per provider ────────────────────────────────────────────────────

const PROVIDER_DEFAULTS = {
    openrouter: {
        model_id: `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`,
        model_name: `Dolphin Mistral 24B Venice`,
        prefix: `openrouter`,
    },
    venice: {
        model_id: `venice-uncensored`,
        model_name: `Venice Uncensored`,
        prefix: `venice`,
    },
}


// ─── Styled components ───────────────────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-height: 0;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    overflow-y: auto;

    &::before, &::after {
        content: '';
        flex: 1 0 0px;
    }
`

const Title = styled.h1`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    font-size: clamp( 1.5rem, 1.2rem + 1.5vw, 2rem );
    color: ${ ( { theme } ) => theme.colors.text };
    border-bottom: 3px solid ${ ( { theme } ) => theme.colors.info };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
    max-width: 520px;
    line-height: 1.5;
`

const FormCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.md };
    width: 100%;
    max-width: 480px;
`

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const Label = styled.label`
    font-size: 0.85rem;
    font-weight: 500;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

const Input = styled.input`
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    width: 100%;

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.info }; }
`

const TextArea = styled.textarea`
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    width: 100%;
    min-height: 80px;
    resize: vertical;
    font-family: inherit;

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.info }; }
`

const Hint = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    line-height: 1.4;
`

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { $error, theme } ) => $error ? theme.colors.error : theme.colors.text_muted };
`

const BrowseButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.info };
    transition: opacity 0.15s;
    min-height: 2.75rem;

    &:hover { opacity: 0.7; }
`

const InputRow = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    align-items: center;
`

const SmallInput = styled( Input )`
    width: 80px;
    text-align: center;
`

const ConnectButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.info };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    font-size: 1rem;
    font-weight: 600;
    margin-top: ${ ( { theme } ) => theme.spacing.md };
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    min-height: 2.75rem;

    &:hover:not(:disabled) { opacity: 0.85; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Spinner = styled( LoaderCircle )`
    animation: spin 1s linear infinite;
    @keyframes spin { to { transform: rotate( 360deg ); } }
`

const AdvancedToggle = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-top: ${ ( { theme } ) => theme.spacing.xs };
    transition: opacity 0.15s;

    &:hover { opacity: 0.7; }

    svg { transition: transform 0.2s; }
    &[aria-expanded="true"] svg { transform: rotate( 180deg ); }
`

const AdvancedPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.md };
    padding-top: ${ ( { theme } ) => theme.spacing.sm };
`


// ─── Component ───────────────────────────────────────────────────────────────

export default function CloudSetupPage() {

    const navigate = useNavigate()
    const [ search_params ] = useSearchParams()
    const { t } = useTranslation( `nerd` )

    // Determine provider from query string — defaults to openrouter
    const provider = search_params.get( `provider` ) === `venice` ? `venice` : `openrouter`
    const defaults = PROVIDER_DEFAULTS[ provider ]
    const is_venice = provider === `venice`

    // Stores
    const openrouter_store = use_openrouter_store()
    const venice_store = use_venice_store()
    const store = is_venice ? venice_store : openrouter_store

    // Form state — auto-fill API key from last saved key
    const [ api_key, set_api_key ] = useState( store.api_key )
    const [ model_id, set_model_id ] = useState( defaults.model_id )
    const [ model_display_name, set_model_display_name ] = useState( defaults.model_name )
    const [ show_suggested, set_show_suggested ] = useState( false )
    const [ show_advanced, set_show_advanced ] = useState( false )

    // API key validation state
    const [ key_valid, set_key_valid ] = useState( null )
    const [ key_validating, set_key_validating ] = useState( false )

    // Remote model list — fetched from the provider's API after key validates
    const [ remote_models, set_remote_models ] = useState( [] )
    const [ models_loading, set_models_loading ] = useState( false )

    // Optional settings
    const [ daily_limit, set_daily_limit ] = useState( store.daily_credit_limit )
    const [ system_prompt, set_system_prompt ] = useState(
        store.system_prompt || import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT || ``
    )

    // Connect state
    const [ connecting, set_connecting ] = useState( false )
    const [ connect_error, set_connect_error ] = useState( null )

    // Provider-specific validation function
    const validate_key = is_venice ? validate_venice_key : validate_openrouter_key

    // Provider-specific model fetcher
    const fetch_remote = is_venice ? fetch_venice_models : fetch_openrouter_models

    /**
     * Fetch the remote model list for the current provider.
     * Called after key validation succeeds and when user opens the Browse modal.
     */
    const load_remote_models = useCallback( async ( key ) => {

        set_models_loading( true )
        try {
            const models = await fetch_remote( key )
            set_remote_models( models )
        } catch {
            set_remote_models( [] )
        } finally {
            set_models_loading( false )
        }

    }, [ fetch_remote ] )

    /**
     * Validate the API key when the input loses focus.
     * On success, also fetch the remote model list.
     */
    const handle_key_blur = useCallback( async () => {

        const trimmed = api_key.trim()
        if( !trimmed || trimmed.length < 10 ) {
            set_key_valid( null )
            return
        }

        set_key_validating( true )
        const valid = await validate_key( trimmed )
        set_key_valid( valid )
        set_key_validating( false )

        // Pre-fetch models on successful validation
        if( valid ) load_remote_models( trimmed )

    }, [ api_key, validate_key, load_remote_models ] )


    /**
     * Handle suggested model selection from the modal.
     */
    const handle_suggested_select = ( selected_id, display_name ) => {

        set_model_id( selected_id )
        set_model_display_name( display_name || selected_id.split( `/` ).pop() )

    }


    /**
     * Connect: save settings to store → set active model → navigate to /chat.
     */
    const handle_connect = async () => {

        const trimmed_key = api_key.trim()
        const trimmed_model = model_id.trim() || defaults.model_id

        if( !trimmed_key ) return

        set_connecting( true )
        set_connect_error( null )

        try {

            // Validate API key if not already validated
            if( key_valid !== true ) {
                const valid = await validate_key( trimmed_key )
                if( !valid ) {
                    set_connect_error( t( `invalid_api_key` ) )
                    set_connecting( false )
                    return
                }
            }

            // Save settings to store
            store.set_api_key( trimmed_key )
            store.set_daily_credit_limit( daily_limit )
            store.set_system_prompt( system_prompt )

            // Add model to store if not already tracked
            const id_field = is_venice ? `venice_id` : `openrouter_id`
            const has = store.has_model( trimmed_model )

            if( !has ) {

                const display_name = model_display_name || trimmed_model.split( `/` ).pop()

                store.add_model( {
                    id: `${ defaults.prefix }-${ trimmed_model.replace( /[/:]/g, `-` ) }`,
                    [ id_field ]: trimmed_model,
                    name: display_name,
                    created_at: Date.now(),
                } )

            }

            // Set as active model and navigate to chat
            const active_id = `${ defaults.prefix }:${ trimmed_model }`
            localStorage.setItem( storage_key( `active_model_id` ), active_id )
            navigate( `/chat` )

        } catch ( err ) {
            set_connect_error( err.message )
        } finally {
            set_connecting( false )
        }

    }


    // Provider-specific labels
    const key_label = is_venice ? t( `venice_api_key_label` ) : t( `api_key_label` )
    const key_placeholder = is_venice ? t( `venice_api_key_placeholder` ) : t( `api_key_placeholder` )
    const key_hint = is_venice ? t( `venice_api_key_hint` ) : t( `api_key_hint` )
    const validating_text = is_venice ? t( `venice_validating_key` ) : t( `validating_key` )
    const valid_text = is_venice ? t( `venice_key_valid` ) : t( `key_valid` )
    const invalid_text = is_venice ? t( `venice_key_invalid` ) : t( `key_invalid` )

    const can_connect = api_key.trim() && !connecting

    return <Container>

        <Title><Cloud size={ 24 } /> { t( `cloud_page_title` ) }</Title>
        <Subtitle>{ t( `page_subtitle` ) }</Subtitle>

        <FormCard>

            { /* ── API Key ── */ }
            <FieldGroup>
                <Label>{ key_label }</Label>
                <Input
                    type="password"
                    data-testid="cloud-api-key"
                    placeholder={ key_placeholder }
                    value={ api_key }
                    onChange={ ( e ) => set_api_key( e.target.value ) }
                    onBlur={ handle_key_blur }
                />
                <Hint>{ key_hint }</Hint>

                { key_validating && <StatusRow>
                    <Spinner size={ 12 } /> { validating_text }
                </StatusRow> }

                { key_valid === true && <StatusRow>
                    <Check size={ 12 } /> { valid_text }
                </StatusRow> }

                { key_valid === false && <StatusRow $error>
                    <AlertTriangle size={ 12 } /> { invalid_text }
                </StatusRow> }
            </FieldGroup>

            { /* ── Model selector ── */ }
            <FieldGroup>
                <Label>{ t( `model_name_label` ) }</Label>
                <Input
                    type="text"
                    data-testid="cloud-model-id"
                    placeholder={ defaults.model_id }
                    value={ model_id }
                    onChange={ ( e ) => {
                        set_model_id( e.target.value )
                        set_model_display_name( `` )
                    } }
                />

                <BrowseButton
                    data-testid="browse-suggested-models"
                    onClick={ () => {
                        set_show_suggested( true )
                        // Fetch models on open if we have a key but haven't fetched yet
                        if( remote_models.length === 0 && api_key.trim().length >= 10 ) {
                            load_remote_models( api_key.trim() )
                        }
                    } }
                >
                    <List size={ 14 } />
                    { t( `browse_suggested` ) }
                </BrowseButton>

                { model_display_name && <StatusRow>
                    <Check size={ 12 } /> { model_display_name }
                </StatusRow> }
            </FieldGroup>

            { /* ── Connect button ── */ }
            <ConnectButton
                data-testid="connect-btn"
                onClick={ handle_connect }
                disabled={ !can_connect }
            >
                { connecting
                    ? <><Spinner size={ 18 } /> { t( `connecting` ) }</>
                    : <> { t( `connect_button` ) } <ArrowRight size={ 18 } /></> }
            </ConnectButton>

            { connect_error && <StatusRow $error>
                <AlertTriangle size={ 12 } /> { t( `connect_error`, { error: connect_error } ) }
            </StatusRow> }

            { /* ── Advanced Settings toggle ── */ }
            <AdvancedToggle
                aria-expanded={ show_advanced }
                onClick={ () => set_show_advanced( !show_advanced ) }
            >
                <ChevronDown size={ 14 } />
                { t( `advanced_settings` ) }
            </AdvancedToggle>

            { show_advanced && <AdvancedPanel>

                { /* ── Daily credit limit ── */ }
                <FieldGroup>
                    <Label>{ t( `daily_limit_label` ) }</Label>
                    <InputRow>
                        <SmallInput
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={ daily_limit }
                            onChange={ ( e ) => set_daily_limit( parseFloat( e.target.value ) || 5 ) }
                        />
                        <Hint>USD per day</Hint>
                    </InputRow>
                </FieldGroup>

                { /* ── System prompt ── */ }
                <FieldGroup>
                    <Label>{ t( `system_prompt_label` ) }</Label>
                    <TextArea
                        placeholder={ import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT || `` }
                        value={ system_prompt }
                        onChange={ ( e ) => set_system_prompt( e.target.value ) }
                    />
                </FieldGroup>

            </AdvancedPanel> }

        </FormCard>


        { /* Suggested models modal — shows remote API models, not local catalog */ }
        <SuggestedModelsModal
            is_open={ show_suggested }
            on_close={ () => set_show_suggested( false ) }
            on_select={ handle_suggested_select }
            current_model={ model_id }
            remote_models={ remote_models }
            models_loading={ models_loading }
        />

    </Container>

}
