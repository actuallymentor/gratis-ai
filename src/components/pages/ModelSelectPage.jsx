import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation } from 'react-router-dom'
import { get_recommended_tier } from '../../utils/device_detection'
import use_device_capabilities from '../../hooks/use_device_capabilities'
import { get_model_for_tier, TIER_INFO } from '../../providers/model_registry'
import ModelCard from '../molecules/ModelCard'
import DeviceInfo from '../atoms/DeviceInfo'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    overflow-y: auto;
`

const Title = styled.h1`
    font-size: 2rem;
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
    text-align: center;
    max-width: 500px;
`

const TierSelector = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
    flex-wrap: wrap;
    justify-content: center;
`

const TierButton = styled.button`
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    border: 1px solid ${ ( { theme, $active } ) =>
        $active ? theme.colors.primary : theme.colors.border };
    background: ${ ( { theme, $active } ) =>
        $active ? theme.colors.primary : `transparent` };
    color: ${ ( { theme, $active } ) =>
        $active ? `white` : theme.colors.text };
    font-size: 0.85rem;
    transition: all 0.2s;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.primary };
    }
`

const RecommendBadge = styled.span`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.success };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const DownloadButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.primary };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    font-size: 1rem;
    font-weight: 600;
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    transition: background 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.primary_hover };
    }
`

/**
 * Model selection page - recommends model tier based on device capabilities
 * @returns {JSX.Element}
 */
export default function ModelSelectPage() {

    const navigate = useNavigate()
    const location = useLocation()

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

    return <Container>

        <Title>Select a Model</Title>
        <Subtitle>
            Based on your device, we recommend a model tier. You can override this choice.
        </Subtitle>

        { /* Device capabilities summary */ }
        { capabilities && <DeviceInfo capabilities={ capabilities } /> }

        { /* Tier recommendation badge */ }
        <RecommendBadge>
            Recommended: { TIER_INFO.find( t => t.tier === recommended )?.label }
        </RecommendBadge>

        { /* Tier selector buttons */ }
        <TierSelector>
            { TIER_INFO.map( ( { tier, label } ) =>
                <TierButton
                    key={ tier }
                    $active={ tier === active_tier }
                    onClick={ () => set_selected_tier( tier ) }
                >
                    { label }
                    { tier === recommended ? ` ★` : `` }
                </TierButton>
            ) }
        </TierSelector>

        { /* Selected model card */ }
        { selected_model && <ModelCard
            model={ selected_model }
            selected
            on_select={ () => {} }
        /> }

        <DownloadButton
            data-testid="model-select-confirm-btn"
            onClick={ handle_download }
        >
            Download & Start
        </DownloadButton>

    </Container>

}
