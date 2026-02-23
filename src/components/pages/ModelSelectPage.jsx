import { useState, useMemo } from 'react'
import styled, { useTheme } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, ArrowRight, Sparkles, AlertTriangle, Loader, Link, Zap } from 'lucide-react'
import use_device_capabilities from '../../hooks/use_device_capabilities'
import use_model_manager from '../../hooks/use_model_manager'
import { select_model_pair, get_featured_models, format_file_size, can_fit_in_memory, estimate_download_time } from '../../utils/model_catalog'
import { parse_hf_url, resolve_hf_model } from '../../utils/hf_url_parser'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    overflow-y: auto;

    /* Flex spacers center content when it fits, collapse when it overflows */
    &::before, &::after {
        content: '';
        flex: 1 0 0px;
    }
`

const Title = styled.h1`
    font-size: clamp( 1.5rem, 1.2rem + 1.5vw, 2rem );
    color: ${ ( { theme } ) => theme.colors.text };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
    max-width: 520px;
    line-height: 1.5;
`


// ─── Two-card recommendation layout ─────────────────────────────────────────────

const CardRow = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.md };
    width: 100%;
    max-width: 680px;
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };

    @media ( max-width: 680px ) {
        flex-direction: column;
    }
`

const OptionCard = styled.button`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${ ( { theme } ) => theme.spacing.lg };
    border: 2px solid ${ ( { theme, $active } ) => $active ? theme.colors.accent : theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    text-align: center;
    transition: border-color 0.15s, box-shadow 0.15s;
    cursor: pointer;
    background: transparent;

    &:hover {
        border-color: ${ ( { theme, $active } ) => $active ? theme.colors.accent : theme.colors.text_muted };
    }

    ${ ( { $active, theme } ) => $active && `
        box-shadow: 0 0 0 1px ${ theme.colors.accent };
    ` }
`

const OptionBadge = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
    color: ${ ( { $variant, theme } ) =>
        $variant === `faster` ? theme.colors.success : theme.colors.accent };
`

const CardModelName = styled.h2`
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: ${ ( { theme } ) => theme.spacing.xs };
`

const CardDescription = styled.p`
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
    line-height: 1.4;
`

const CardMeta = styled.div`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const DownloadEstimate = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-top: ${ ( { theme } ) => theme.spacing.xs };
`

const CachedBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: ${ ( { theme } ) => theme.colors.success };
    margin-top: ${ ( { theme } ) => theme.spacing.sm };
    padding: 2px 8px;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    border: 1px solid ${ ( { theme } ) => theme.colors.success };
`


// ─── Single-card fallback (when no faster option exists) ─────────────────────────

const RecommendedCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${ ( { theme } ) => theme.spacing.lg };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    max-width: 420px;
    width: 100%;
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const RecommendedBadge = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.accent };
    font-weight: 600;
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const ModelName = styled.h2`
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: ${ ( { theme } ) => theme.spacing.xs };
`

const ModelDescription = styled.p`
    font-size: 0.9rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
    text-align: center;
    line-height: 1.4;
`

const ModelSize = styled.div`
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`


// ─── Shared UI components ────────────────────────────────────────────────────────

const DownloadButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.accent };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    font-size: 1rem;
    font-weight: 600;
    margin-top: ${ ( { theme } ) => theme.spacing.md };
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    min-height: 2.75rem;

    &:hover { opacity: 0.85; }
`

// Toggle buttons for expanding model lists
const ToggleButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    transition: color 0.15s;
    min-height: 2.75rem;

    &:hover { color: ${ ( { theme } ) => theme.colors.text_secondary }; }
`

const ExpandPanel = styled.div`
    overflow-y: ${ ( { $expanded } ) => $expanded ? `auto` : `hidden` };
    max-height: ${ ( { $expanded } ) => $expanded ? `min( 800px, 40vh )` : `0px` };
    opacity: ${ ( { $expanded } ) => $expanded ? 1 : 0 };
    visibility: ${ ( { $expanded } ) => $expanded ? `visible` : `hidden` };
    transition: max-height 0.3s ease, opacity 0.2s ease, visibility 0.3s ease;
    flex-shrink: 0;
    width: 100%;
    max-width: 420px;

    @media ( prefers-reduced-motion: reduce ) {
        transition: none;
    }
`

const ModelList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding-top: ${ ( { theme } ) => theme.spacing.md };
`

const ModelOption = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: ${ ( { theme } ) => theme.spacing.md };
    border: 1px solid ${ ( { theme, $active } ) => $active ? theme.colors.accent : theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    text-align: left;
    transition: border-color 0.15s;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.text_muted };
    }
`

const OptionInfo = styled.div`
    flex: 1;
`

const OptionName = styled.div`
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 2px;
`

const OptionMeta = styled.div`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const CheckIcon = styled.div`
    color: ${ ( { theme } ) => theme.colors.accent };
    flex-shrink: 0;
`

// Step progress indicator
const StepIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const StepDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme, $active, $done } ) =>
        $done ? theme.colors.accent
            : $active ? theme.colors.accent
                : theme.colors.border };
`

const StepLine = styled.div`
    width: 24px;
    height: 2px;
    background: ${ ( { theme, $done } ) => $done ? theme.colors.accent : theme.colors.border };
`

const MemoryWarning = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.warning || `#c49660` };
    margin-top: ${ ( { theme } ) => theme.spacing.sm };
`

// Custom model input section
const CustomModelSection = styled.div`
    margin-top: ${ ( { theme } ) => theme.spacing.md };
    padding-top: ${ ( { theme } ) => theme.spacing.md };
    border-top: 1px solid ${ ( { theme } ) => theme.colors.border };
    width: 100%;
`

const CustomModelLabel = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.85rem;
    font-weight: 500;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const CustomModelRow = styled.form`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const CustomModelInput = styled.input`
    flex: 1;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    min-width: 0;

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.accent }; }
`

const LoadButton = styled.button`
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    border: 1px solid ${ ( { theme } ) => theme.colors.accent };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.accent };
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.15s;

    &:hover:not(:disabled) { background: ${ ( { theme } ) => theme.colors.accent }; color: white; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const CustomModelStatus = styled.div`
    font-size: 0.8rem;
    margin-top: ${ ( { theme } ) => theme.spacing.xs };
    color: ${ ( { $error, theme } ) => $error ?  theme.colors.error || `#b85c5c`  : theme.colors.text_muted };
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const Spinner = styled( Loader )`
    animation: spin 1s linear infinite;
    @keyframes spin { to { transform: rotate( 360deg ); } }
`


/**
 * Model selection page — recommends up to two models (faster + smarter),
 * auto-detects cached models, estimates download time, and allows alternatives.
 * @returns {JSX.Element}
 */
export default function ModelSelectPage() {

    const navigate = useNavigate()
    const theme = useTheme()
    const [ show_alternatives, set_show_alternatives ] = useState( false )

    // Device memory budget and cached model detection
    const { max_model_bytes } = use_device_capabilities()
    const { cached_models } = use_model_manager()

    const is_cached = ( model_id ) =>
        cached_models.some( m => m.id === model_id )

    // Select smarter/faster pair based on device memory
    const { smarter, faster } = useMemo(
        () => select_model_pair( max_model_bytes ),
        [ max_model_bytes ],
    )

    // Featured models for the alternatives list, sorted: fits-in-memory first → params desc
    const featured_models = useMemo( () => {

        return get_featured_models().sort( ( a, b ) => {

            const a_fits = can_fit_in_memory( a, max_model_bytes ) ? 1 : 0
            const b_fits = can_fit_in_memory( b, max_model_bytes ) ? 1 : 0
            if( a_fits !== b_fits ) return b_fits - a_fits

            return b.parameters - a.parameters

        } )

    }, [ max_model_bytes ] )

    // Track user selection — defaults to the smarter option
    const [ selected_model_id, set_selected_model_id ] = useState( null )

    // Custom model state
    const [ custom_url, set_custom_url ] = useState( `` )
    const [ custom_model, set_custom_model ] = useState( null )
    const [ custom_loading, set_custom_loading ] = useState( false )
    const [ custom_error, set_custom_error ] = useState( null )

    // Resolve the active model — custom > user pick > smarter default
    const active_model = custom_model
        ? custom_model
        : selected_model_id
            ? [ ...featured_models, faster ].filter( Boolean ).find( m => m.id === selected_model_id ) ?? smarter
            : smarter

    const active_is_cached = active_model && is_cached( active_model.id )

    const handle_download = () => {
        if( !active_model ) return
        navigate( `/download`, { state: { model: active_model } } )
    }

    const handle_select = ( model_id ) => {
        set_custom_model( null )
        set_custom_error( null )
        set_selected_model_id( model_id )
    }

    // Resolve a custom HuggingFace URL into a model definition
    const handle_custom_load = async ( e ) => {

        e.preventDefault()

        const parsed = parse_hf_url( custom_url )
        if( !parsed ) {
            set_custom_error( `Invalid URL. Use a HuggingFace link like hf.co/org/repo:Q4_K_M` )
            return
        }

        set_custom_loading( true )
        set_custom_error( null )
        set_custom_model( null )
        set_selected_model_id( null )

        try {
            const model = await resolve_hf_model( parsed )
            set_custom_model( model )
        } catch ( err ) {
            set_custom_error( err.message )
        } finally {
            set_custom_loading( false )
        }

    }

    // Alternatives exclude both the smarter and faster recommendations
    const shown_ids = new Set( [ smarter?.id, faster?.id ].filter( Boolean ) )
    const alternative_models = featured_models.filter( m => !shown_ids.has( m.id ) )

    // Two-card layout when a meaningfully smaller model exists
    const show_two_cards = faster !== null

    return <Container>

        <Title>Pick a model</Title>
        <Subtitle>
            { show_two_cards
                ? `We picked two options based on your device. Choose the balance that works for you.`
                : `Based on your device, we picked the best AI model. It will be downloaded once and stored locally.` }
        </Subtitle>

        { /* ── Two-card layout ── */ }
        { show_two_cards && <CardRow>

            { /* Faster option */ }
            <OptionCard
                $active={ active_model?.id === faster.id }
                onClick={ () => handle_select( faster.id ) }
            >
                <OptionBadge $variant="faster">
                    <Zap size={ 14 } />
                    Faster Option
                </OptionBadge>
                <CardModelName>{ faster.name }</CardModelName>
                <CardDescription>{ faster.description }</CardDescription>
                <CardMeta>
                    { format_file_size( faster.file_size_bytes ) } — { faster.quantization }
                </CardMeta>
                <DownloadEstimate>{ estimate_download_time( faster.file_size_bytes ) }</DownloadEstimate>
                { is_cached( faster.id ) && <CachedBadge>
                    <Check size={ 12 } /> Already downloaded
                </CachedBadge> }
            </OptionCard>

            { /* Smarter option */ }
            <OptionCard
                $active={ active_model?.id === smarter.id }
                onClick={ () => handle_select( smarter.id ) }
            >
                <OptionBadge $variant="smarter">
                    <Sparkles size={ 14 } />
                    Smarter Option
                </OptionBadge>
                <CardModelName>{ smarter.name }</CardModelName>
                <CardDescription>{ smarter.description }</CardDescription>
                <CardMeta>
                    { format_file_size( smarter.file_size_bytes ) } — { smarter.quantization }
                </CardMeta>
                <DownloadEstimate>{ estimate_download_time( smarter.file_size_bytes ) }</DownloadEstimate>
                { is_cached( smarter.id ) && <CachedBadge>
                    <Check size={ 12 } /> Already downloaded
                </CachedBadge> }
            </OptionCard>

        </CardRow> }

        { /* ── Single-card fallback (no meaningfully smaller model available) ── */ }
        { !show_two_cards && active_model && <RecommendedCard>
            <RecommendedBadge>
                <Sparkles size={ 14 } />
                { custom_model
                    ? `Custom HuggingFace model`
                    : `Recommended for your device` }
            </RecommendedBadge>
            <ModelName>{ active_model.name }</ModelName>
            <ModelDescription>{ active_model.description }</ModelDescription>
            <ModelSize>
                { format_file_size( active_model.file_size_bytes ) }
                { active_model.quantization && ` — ${ active_model.quantization }` }
            </ModelSize>
            <DownloadEstimate>{ estimate_download_time( active_model.file_size_bytes ) }</DownloadEstimate>
            { is_cached( active_model.id ) && <CachedBadge>
                <Check size={ 12 } /> Already downloaded
            </CachedBadge> }
            { !can_fit_in_memory( active_model, max_model_bytes ) && <MemoryWarning>
                <AlertTriangle size={ 14 } />
                May be too large for this browser
            </MemoryWarning> }
        </RecommendedCard> }

        <DownloadButton
            data-testid="model-select-confirm-btn"
            onClick={ handle_download }
        >
            { active_is_cached ? `Start Chatting` : `Download & Start` } <ArrowRight size={ 18 } />
        </DownloadButton>

        { /* Step progress */ }
        <StepIndicator data-testid="step-indicator">
            <StepDot $done />
            <StepLine $done />
            <StepDot $active />
            <StepLine />
            <StepDot />
        </StepIndicator>

        { /* All alternatives in one list — oversized models get a warning label */ }
        { alternative_models.length > 0 && <>
            <ToggleButton
                data-testid="change-model-toggle"
                onClick={ () => set_show_alternatives( !show_alternatives ) }
            >
                Choose a different model
                { show_alternatives ? <ChevronUp size={ 14 } /> : <ChevronDown size={ 14 } /> }
            </ToggleButton>

            <ExpandPanel $expanded={ show_alternatives }>
                <ModelList>
                    { alternative_models.map( ( model ) => {
                        const is_selected = model.id === active_model?.id
                        const too_large = !can_fit_in_memory( model, max_model_bytes )
                        return <ModelOption
                            key={ model.id }
                            $active={ is_selected }
                            onClick={ () => handle_select( model.id ) }
                        >
                            <OptionInfo>
                                <OptionName>{ model.name }</OptionName>
                                <OptionMeta>
                                    { model.parameters_label } — { format_file_size( model.file_size_bytes ) }
                                    { too_large ? ` — may not fit in memory` : `` }
                                    { is_cached( model.id ) ? ` — ✓ downloaded` : `` }
                                </OptionMeta>
                            </OptionInfo>
                            { is_selected && <CheckIcon><Check size={ 16 } /></CheckIcon> }
                            { too_large && !is_selected && <AlertTriangle size={ 14 } style={ { color: theme.colors.warning, flexShrink: 0 } } /> }
                        </ModelOption>
                    } ) }
                </ModelList>

                { /* Custom HuggingFace model input */ }
                <CustomModelSection>
                    <CustomModelLabel>
                        <Link size={ 14 } />
                        Custom HuggingFace model
                    </CustomModelLabel>

                    <CustomModelRow onSubmit={ handle_custom_load }>
                        <CustomModelInput
                            data-testid="custom-model-input"
                            type="text"
                            placeholder="hf.co/org/repo:Q4_K_M"
                            value={ custom_url }
                            onChange={ ( e ) => set_custom_url( e.target.value ) }
                            disabled={ custom_loading }
                        />
                        <LoadButton
                            data-testid="custom-model-load-btn"
                            type="submit"
                            disabled={ custom_loading || !custom_url.trim() }
                        >
                            { custom_loading ? `Loading...` : `Load` }
                        </LoadButton>
                    </CustomModelRow>

                    { /* Status feedback */ }
                    { custom_loading && <CustomModelStatus>
                        <Spinner size={ 12 } /> Resolving model...
                    </CustomModelStatus> }

                    { custom_error && <CustomModelStatus $error>
                        <AlertTriangle size={ 12 } /> { custom_error }
                    </CustomModelStatus> }

                    { custom_model && !custom_loading && <CustomModelStatus>
                        <Check size={ 12 } /> { custom_model.name } — { format_file_size( custom_model.file_size_bytes ) } ({ custom_model.quantization })
                    </CustomModelStatus> }

                    { /* Warn browser users about large custom models that may exceed WASM limits */ }
                    { custom_model && !custom_loading && !window.electronAPI && custom_model.file_size_bytes > 2_000_000_000 && <CustomModelStatus $error>
                        <AlertTriangle size={ 12 } /> Large models may fail to load in the browser. Consider a smaller quantization or the desktop app.
                    </CustomModelStatus> }

                </CustomModelSection>

            </ExpandPanel>
        </> }

    </Container>

}
