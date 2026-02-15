import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react'
import { get_recommended_tier } from '../../utils/device_detection'
import use_device_capabilities from '../../hooks/use_device_capabilities'
import { get_model_for_tier, TIER_INFO, format_file_size } from '../../providers/model_registry'

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

// "Choose a different model" is hidden behind a toggle (progressive disclosure)
const ChangeModelToggle = styled.button`
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

const AlternativePanel = styled.div`
    overflow: hidden;
    max-height: ${ ( { $expanded } ) => $expanded ? `600px` : `0px` };
    opacity: ${ ( { $expanded } ) => $expanded ? 1 : 0 };
    visibility: ${ ( { $expanded } ) => $expanded ? `visible` : `hidden` };
    transition: max-height 0.3s ease, opacity 0.2s ease, visibility 0.3s ease;
    width: 100%;
    max-width: 420px;

    @media ( prefers-reduced-motion: reduce ) {
        transition: none;
    }
`

const AlternativeList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding-top: ${ ( { theme } ) => theme.spacing.md };
`

const AlternativeOption = styled.button`
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

// User-friendly tier descriptions (no jargon)
const FRIENDLY_TIER_LABELS = {
    lightweight: `Faster responses, smaller download`,
    medium: `Good balance of speed and quality`,
    heavy: `Smarter responses, larger download`,
    ultra: `Best quality, requires powerful hardware`,
}

/**
 * Model selection page - auto-recommends based on device, hides complexity.
 * Uses progressive disclosure: recommended model shown prominently,
 * alternatives hidden behind "Choose a different model" toggle.
 * @returns {JSX.Element}
 */
export default function ModelSelectPage() {

    const navigate = useNavigate()
    const location = useLocation()
    const [ show_alternatives, set_show_alternatives ] = useState( false )

    // Get capabilities from navigation state or detect fresh
    const { capabilities: detected_caps } = use_device_capabilities()
    const capabilities = location.state?.capabilities || detected_caps

    // Determine recommended tier and allow override
    const recommended = useMemo( () => {
        if( !capabilities ) return `lightweight`
        return get_recommended_tier( capabilities )
    }, [ capabilities ] )

    const [ selected_tier, set_selected_tier ] = useState( null )
    const active_tier = selected_tier || recommended

    // Get the model for the active tier
    const selected_model = get_model_for_tier( active_tier )

    const handle_download = () => {
        if( !selected_model ) return
        navigate( `/download`, { state: { model: selected_model } } )
    }

    const handle_select_tier = ( tier ) => {
        set_selected_tier( tier )
    }

    return <Container>

        <Title>We found a model for you</Title>
        <Subtitle>
            Based on your device, we picked the best AI model.
            It will be downloaded once and stored locally.
        </Subtitle>

        { /* Recommended model card — always visible */ }
        { selected_model && <RecommendedCard>
            <RecommendedBadge>
                <Sparkles size={ 14 } />
                { active_tier === recommended ? `Recommended for your device` : FRIENDLY_TIER_LABELS[ active_tier ] }
            </RecommendedBadge>
            <ModelName>{ selected_model.name }</ModelName>
            <ModelDescription>{ selected_model.description }</ModelDescription>
            <ModelSize>
                Download size: { format_file_size( selected_model.file_size_bytes ) }
            </ModelSize>
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

        { /* Progressive disclosure: alternatives hidden by default */ }
        <ChangeModelToggle
            data-testid="change-model-toggle"
            onClick={ () => set_show_alternatives( !show_alternatives ) }
        >
            Choose a different model
            { show_alternatives ? <ChevronUp size={ 14 } /> : <ChevronDown size={ 14 } /> }
        </ChangeModelToggle>

        <AlternativePanel $expanded={ show_alternatives }>
            <AlternativeList>
                { TIER_INFO.map( ( { tier } ) => {
                    const model = get_model_for_tier( tier )
                    if( !model ) return null
                    const is_selected = tier === active_tier
                    const is_recommended = tier === recommended
                    return <AlternativeOption
                        key={ tier }
                        $active={ is_selected }
                        onClick={ () => handle_select_tier( tier ) }
                    >
                        <OptionInfo>
                            <OptionName>
                                { model.name }
                                { is_recommended ? ` (recommended)` : `` }
                            </OptionName>
                            <OptionMeta>
                                { FRIENDLY_TIER_LABELS[ tier ] } — { format_file_size( model.file_size_bytes ) }
                            </OptionMeta>
                        </OptionInfo>
                        { is_selected && <CheckIcon><Check size={ 16 } /></CheckIcon> }
                    </AlternativeOption>
                } ) }
            </AlternativeList>
        </AlternativePanel>

    </Container>

}
