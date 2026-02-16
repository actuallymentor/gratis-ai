import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import { get_recommended_tier } from '../../utils/device_detection'
import use_device_capabilities from '../../hooks/use_device_capabilities'
import { MODEL_REGISTRY, format_file_size, can_fit_in_memory } from '../../providers/model_registry'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    overflow-y: auto;
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
    max-width: 460px;
    line-height: 1.5;
`

// The recommended model is shown prominently
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
    overflow: hidden;
    max-height: ${ ( { $expanded } ) => $expanded ? `800px` : `0px` };
    opacity: ${ ( { $expanded } ) => $expanded ? 1 : 0 };
    visibility: ${ ( { $expanded } ) => $expanded ? `visible` : `hidden` };
    transition: max-height 0.3s ease, opacity 0.2s ease, visibility 0.3s ease;
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
    opacity: ${ ( { $dimmed } ) => $dimmed ? 0.6 : 1 };

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
    color: ${ ( { theme } ) => theme.colors.warning || `#e67e22` };
    margin-top: ${ ( { theme } ) => theme.spacing.sm };
`

// Tier order for sorting — higher quality models sort later
const TIER_ORDER = { lightweight: 0, medium: 1, heavy: 2, ultra: 3 }

/**
 * Model selection page - auto-recommends based on device, hides complexity.
 * Compatible models are shown prominently. Models too large for the browser's
 * memory are hidden under a "More models" toggle with a warning.
 * @returns {JSX.Element}
 */
export default function ModelSelectPage() {

    const navigate = useNavigate()
    const location = useLocation()
    const [ show_alternatives, set_show_alternatives ] = useState( false )
    const [ show_large_models, set_show_large_models ] = useState( false )

    // Get capabilities from navigation state or detect fresh
    const { capabilities: detected_caps, max_model_bytes } = use_device_capabilities()
    const capabilities = location.state?.capabilities || detected_caps

    // Determine recommended tier based on device
    const recommended_tier = useMemo( () => {
        if( !capabilities ) return `lightweight`
        return get_recommended_tier( capabilities )
    }, [ capabilities ] )

    // Split models into those that fit in memory and those that don't
    const { compatible_models, oversized_models } = useMemo( () => {

        const compatible = MODEL_REGISTRY.filter( m => can_fit_in_memory( m, max_model_bytes ) )
        const oversized = MODEL_REGISTRY.filter( m => !can_fit_in_memory( m, max_model_bytes ) )

        // Sort both lists: recommended tier first, then by size descending (best quality first)
        const sort_models = ( a, b ) => {
            const a_recommended = a.category === recommended_tier ? 1 : 0
            const b_recommended = b.category === recommended_tier ? 1 : 0
            if( a_recommended !== b_recommended ) return b_recommended - a_recommended
            return TIER_ORDER[ b.category ] - TIER_ORDER[ a.category ]
        }

        compatible.sort( sort_models )
        oversized.sort( sort_models )

        return { compatible_models: compatible, oversized_models: oversized }

    }, [ max_model_bytes, recommended_tier ] )

    // The recommended model is the best compatible model (first after sorting)
    const recommended_model = compatible_models[ 0 ] || null

    // Track user selection — null means use the recommendation
    const [ selected_model_id, set_selected_model_id ] = useState( null )

    // Resolve the active model — user pick or recommendation
    const active_model = selected_model_id
        ? MODEL_REGISTRY.find( m => m.id === selected_model_id )
        : recommended_model

    const handle_download = () => {
        if( !active_model ) return
        navigate( `/download`, { state: { model: active_model } } )
    }

    const handle_select = ( model_id ) => {
        set_selected_model_id( model_id )
    }

    // Alternative models = compatible models minus the currently selected one
    const alternative_models = compatible_models.filter( m => m.id !==  active_model?.id  )

    return <Container>

        <Title>We found a model for you</Title>
        <Subtitle>
            Based on your device, we picked the best AI model.
            It will be downloaded once and stored locally.
        </Subtitle>

        { /* Recommended model card — always visible */ }
        { active_model && <RecommendedCard>
            <RecommendedBadge>
                <Sparkles size={ 14 } />
                { active_model.id === recommended_model?.id
                    ? `Recommended for your device`
                    : active_model.description }
            </RecommendedBadge>
            <ModelName>{ active_model.name }</ModelName>
            <ModelDescription>{ active_model.description }</ModelDescription>
            <ModelSize>
                Download size: { format_file_size( active_model.file_size_bytes ) }
            </ModelSize>
            { !can_fit_in_memory( active_model, max_model_bytes ) && <MemoryWarning>
                <AlertTriangle size={ 14 } />
                May be too large for this browser
            </MemoryWarning> }
        </RecommendedCard> }

        <DownloadButton
            data-testid="model-select-confirm-btn"
            onClick={ handle_download }
        >
            Download & Start <ArrowRight size={ 18 } />
        </DownloadButton>

        { /* Step progress */ }
        <StepIndicator data-testid="step-indicator">
            <StepDot $done />
            <StepLine $done />
            <StepDot $active />
            <StepLine />
            <StepDot />
        </StepIndicator>

        { /* Compatible alternatives — hidden behind toggle */ }
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
                        const is_recommended = model.id === recommended_model?.id
                        return <ModelOption
                            key={ model.id }
                            $active={ is_selected }
                            onClick={ () => handle_select( model.id ) }
                        >
                            <OptionInfo>
                                <OptionName>
                                    { model.name }
                                    { is_recommended ? ` (recommended)` : `` }
                                </OptionName>
                                <OptionMeta>
                                    { model.parameters_label } — { format_file_size( model.file_size_bytes ) }
                                </OptionMeta>
                            </OptionInfo>
                            { is_selected && <CheckIcon><Check size={ 16 } /></CheckIcon> }
                        </ModelOption>
                    } ) }
                </ModelList>
            </ExpandPanel>
        </> }

        { /* Oversized models — separate toggle with warning context */ }
        { oversized_models.length > 0 && <>
            <ToggleButton onClick={ () => set_show_large_models( !show_large_models ) }>
                More models
                { show_large_models ? <ChevronUp size={ 14 } /> : <ChevronDown size={ 14 } /> }
            </ToggleButton>

            <ExpandPanel $expanded={ show_large_models }>
                <MemoryWarning style={ { marginBottom: 8 } }>
                    <AlertTriangle size={ 14 } />
                    These models may be too large for your browser
                </MemoryWarning>
                <ModelList>
                    { oversized_models.map( ( model ) => {
                        const is_selected = model.id === active_model?.id
                        return <ModelOption
                            key={ model.id }
                            $active={ is_selected }
                            $dimmed={ !is_selected }
                            onClick={ () => handle_select( model.id ) }
                        >
                            <OptionInfo>
                                <OptionName>{ model.name }</OptionName>
                                <OptionMeta>
                                    { model.parameters_label } — { format_file_size( model.file_size_bytes ) }
                                </OptionMeta>
                            </OptionInfo>
                            { is_selected
                                ? <CheckIcon><Check size={ 16 } /></CheckIcon>
                                : <AlertTriangle size={ 14 } style={ { color: `#e67e22`, flexShrink: 0 } } /> }
                        </ModelOption>
                    } ) }
                </ModelList>
            </ExpandPanel>
        </> }

    </Container>

}
