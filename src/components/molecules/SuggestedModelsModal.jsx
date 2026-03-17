/**
 * Modal for browsing cloud models fetched from the provider's API.
 *
 * Receives `remote_models` (from the provider's /models endpoint) and
 * `models_loading` as props. Falls back to an empty list with a hint
 * to enter an API key first.
 */
import styled from 'styled-components'
import { X, Check, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

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

const ModelMeta = styled.div`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const CheckIcon = styled.div`
    color: ${ ( { theme } ) => theme.colors.accent };
    flex-shrink: 0;
    margin-left: ${ ( { theme } ) => theme.spacing.sm };
`

const Spinner = styled( LoaderCircle )`
    animation: spin 1s linear infinite;
    @keyframes spin { to { transform: rotate( 360deg ); } }
`

const EmptyState = styled.div`
    text-align: center;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    font-size: 0.85rem;
    line-height: 1.5;
`

const SearchInput = styled.input`
    width: 100%;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.accent }; }
`


/**
 * Modal listing cloud models fetched from the provider's API.
 *
 * @param {Object} props
 * @param {boolean} props.is_open
 * @param {Function} props.on_close
 * @param {Function} props.on_select - Called with (model_id, display_name)
 * @param {string} [props.current_model] - Currently selected model ID (for active state)
 * @param {Array<{ id: string, name?: string }>} [props.remote_models=[]] - Models from the API
 * @param {boolean} [props.models_loading=false]
 */
export default function SuggestedModelsModal( { is_open, on_close, on_select, current_model, remote_models = [], models_loading = false } ) {

    const { t } = useTranslation( `nerd` )
    const [ search, set_search ] = useState( `` )

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

    // Reset search when modal opens
    useEffect( () => {
        if( is_open ) set_search( `` )
    }, [ is_open ] )

    if( !is_open ) return null

    const handle_overlay_click = ( e ) => {
        if( e.target === e.currentTarget ) on_close()
    }

    const handle_select = ( model ) => {
        on_select( model.id, model.name || model.id )
        on_close()
    }

    // Filter models by search query
    const query = search.toLowerCase().trim()
    const filtered = query
        ? remote_models.filter( m =>
            ( m.name || `` ).toLowerCase().includes( query ) || m.id.toLowerCase().includes( query )
        )
        : remote_models

    return <Overlay data-testid="suggested-models-modal" onClick={ handle_overlay_click }>
        <Panel>

            <Header>
                <Title>{ t( `suggested_models_title` ) }</Title>
                <CloseButton onClick={ on_close } aria-label="Close">
                    <X size={ 18 } />
                </CloseButton>
            </Header>

            <Body>

                { /* Search filter — only show when we have models */ }
                { remote_models.length > 0 && <SearchInput
                    type="text"
                    placeholder={ t( `search_models` ) || `Search models…` }
                    value={ search }
                    onChange={ ( e ) => set_search( e.target.value ) }
                    autoFocus
                /> }

                { /* Loading state */ }
                { models_loading && <EmptyState>
                    <Spinner size={ 20 } />
                </EmptyState> }

                { /* Empty state — no API key or fetch failed */ }
                { !models_loading && remote_models.length === 0 && <EmptyState>
                    { t( `enter_key_to_browse` ) || `Enter your API key first to browse available models.` }
                </EmptyState> }

                { /* Model list */ }
                { filtered.map( ( model ) => {

                    const is_active = current_model === model.id

                    return <ModelRow
                        key={ model.id }
                        $active={ is_active }
                        onClick={ () => handle_select( model ) }
                        data-testid={ `suggested-model-${ model.id }` }
                    >
                        <ModelInfo>
                            <ModelName>{ model.name || model.id }</ModelName>
                            <ModelMeta>{ model.id }</ModelMeta>
                        </ModelInfo>
                        { is_active && <CheckIcon><Check size={ 16 } /></CheckIcon> }
                    </ModelRow>

                } ) }

            </Body>

        </Panel>
    </Overlay>

}
