/**
 * Modal for browsing suggested HuggingFace models for RunPod deployment.
 *
 * Flat list sorted by quality score, with the same visual language
 * as the alternatives list in ModelSelectPage.
 */
import styled from 'styled-components'
import { X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { get_cloud_models, quality_score } from '../../utils/model_catalog'

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: ${ ( { theme } ) => theme.colors.modal_overlay };
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`

const Panel = styled.div`
    background: ${ ( { theme } ) => theme.colors.background };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    box-shadow: ${ ( { theme } ) => theme.mode === 'dark'
        ? '0 4px 24px rgba( 0, 0, 0, 0.4 )'
        : '0 4px 24px rgba( 0, 0, 0, 0.1 )' };
    width: min( 520px, 90vw );
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${ ( { theme } ) => theme.spacing.md };
    border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border };
`

const Title = styled.h2`
    font-size: 1.1rem;
    font-weight: 600;
`

const CloseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    transition: color 0.15s;

    &:hover { color: ${ ( { theme } ) => theme.colors.text }; }
`

const Body = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: ${ ( { theme } ) => theme.spacing.md };
`

const ModelRow = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme, $active } ) => $active ? theme.colors.accent : theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    text-align: left;
    transition: border-color 0.15s;
    margin-bottom: ${ ( { theme } ) => theme.spacing.xs };

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.text_muted };
    }
`

const ModelInfo = styled.div`
    flex: 1;
    min-width: 0;
`

const ModelName = styled.div`
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 2px;
`

const ParamTag = styled.span`
    font-size: 0.65rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.accent };
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-left: 6px;
`

const UncensoredTag = styled.span`
    font-size: 0.6rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.error };
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-left: 6px;
    padding: 1px 5px;
    border: 1px solid ${ ( { theme } ) => theme.colors.error };
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
`

const ModelMeta = styled.div`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const ScoreBadge = styled.span`
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.accent };
`

const CheckIcon = styled.div`
    color: ${ ( { theme } ) => theme.colors.accent };
    flex-shrink: 0;
    margin-left: ${ ( { theme } ) => theme.spacing.sm };
`


/**
 * Modal listing suggested HuggingFace models for cloud GPU deployment.
 *
 * @param {Object} props
 * @param {boolean} props.is_open
 * @param {Function} props.on_close
 * @param {Function} props.on_select - Called with hf_repo string
 * @param {string} [props.current_model] - Currently selected hf_repo (for active state)
 */
export default function SuggestedModelsModal( { is_open, on_close, on_select, current_model } ) {

    const { t } = useTranslation( `nerd` )

    // Close on Escape key
    useEffect( () => {

        if( !is_open ) return

        const handle_key = ( e ) => {
            if( e.key === `Escape` ) {
                e.stopPropagation()
                on_close()
            }
        }

        document.addEventListener( `keydown`, handle_key, true )
        return () => document.removeEventListener( `keydown`, handle_key, true )

    }, [ is_open, on_close ] )

    if( !is_open ) return null

    const handle_overlay_click = ( e ) => {
        if( e.target === e.currentTarget ) on_close()
    }

    const handle_select = ( hf_repo ) => {
        on_select( hf_repo )
        on_close()
    }

    return <Overlay data-testid="suggested-models-modal" onClick={ handle_overlay_click }>
        <Panel>

            <Header>
                <Title>{ t( `suggested_models_title` ) }</Title>
                <CloseButton onClick={ on_close } aria-label="Close">
                    <X size={ 18 } />
                </CloseButton>
            </Header>

            <Body>
                { get_cloud_models().map( ( model ) => {

                    const is_active = current_model === model.hf_model_repo
                    const score = Math.round( quality_score( model ) )

                    return <ModelRow
                        key={ model.hf_model_repo }
                        $active={ is_active }
                        onClick={ () => handle_select( model.hf_model_repo ) }
                        data-testid={ `suggested-model-${ model.hf_model_repo }` }
                    >
                        <ModelInfo>
                            <ModelName>
                                { model.name }
                                <ParamTag>{ model.parameters_label }</ParamTag>
                                { model.uncensored && <UncensoredTag>{ t( `uncensored_tag` ) }</UncensoredTag> }
                            </ModelName>
                            <ModelMeta>
                                { model.description }
                                { score > 0 && <> — <ScoreBadge>Score { score }/100</ScoreBadge></> }
                            </ModelMeta>
                        </ModelInfo>
                        { is_active && <CheckIcon><Check size={ 16 } /></CheckIcon> }
                    </ModelRow>

                } ) }
            </Body>

        </Panel>
    </Overlay>

}
