import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { ChevronDown, Check, Plus, Settings, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format_file_size } from '../../providers/model_registry'

const Container = styled.div`
    position: relative;
`

const Trigger = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.sm }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text };
    transition: background 0.15s;
    max-width: 200px;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const ModelName = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    min-width: 260px;
    max-height: 400px;
    overflow-y: auto;
    background: ${ ( { theme } ) => theme.colors.surface };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    box-shadow: 0 4px 12px rgba( 0, 0, 0, 0.15 );
    z-index: 500;
`

const ModelOption = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    width: 100%;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    text-align: left;
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text };
    transition: background 0.15s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const ModelInfo = styled.div`
    flex: 1;
    min-width: 0;
`

const ModelLabel = styled.div`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
`

const ModelMeta = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const Divider = styled.div`
    height: 1px;
    background: ${ ( { theme } ) => theme.colors.border };
    margin: ${ ( { theme } ) => `${ theme.spacing.xs } 0` };
`

const ActionOption = styled( ModelOption )`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    font-size: 0.8rem;
`

/**
 * Model selector dropdown in the TopBar
 * @param {Object} props
 * @param {Array} props.cached_models - Array of cached model metadata objects
 * @param {string} props.active_model_id - Currently active model ID
 * @param {boolean} props.is_switching - Whether a model switch is in progress
 * @param {Function} props.on_switch - Handler for switching models
 * @param {Function} props.on_open_settings - Handler for opening models settings
 * @returns {JSX.Element}
 */
export default function ModelSelector( { cached_models = [], active_model_id, is_switching, on_switch, on_open_settings } ) {

    const [ is_open, set_is_open ] = useState( false )
    const container_ref = useRef( null )
    const navigate = useNavigate()

    // Close dropdown on click outside
    useEffect( () => {

        const handle_click = ( e ) => {
            if( container_ref.current && !container_ref.current.contains( e.target ) ) {
                set_is_open( false )
            }
        }

        if( is_open ) {
            document.addEventListener( `mousedown`, handle_click )
            return () => document.removeEventListener( `mousedown`, handle_click )
        }

    }, [ is_open ] )

    // Find the active model's display name
    const active_model = cached_models.find( ( m ) => m.id === active_model_id )
    const display_name = is_switching ? `Loading...` : active_model?.name || `No model loaded`

    const handle_select = ( model_id ) => {
        set_is_open( false )
        if( model_id !== active_model_id && on_switch ) {
            on_switch( model_id )
        }
    }

    const handle_add = () => {
        set_is_open( false )
        navigate( `/select-model` )
    }

    const handle_manage = () => {
        set_is_open( false )
        if( on_open_settings ) on_open_settings()
    }

    return <Container ref={ container_ref }>

        <Trigger
            data-testid="model-selector-dropdown"
            onClick={ () => set_is_open( !is_open ) }
        >
            { is_switching ? <Loader size={ 14 } /> : null }
            <ModelName>{ display_name }</ModelName>
            <ChevronDown size={ 14 } />
        </Trigger>

        { is_open &&
            <Dropdown>

                { cached_models.length === 0 ?
                    <ModelOption disabled style={ { cursor: `default` } }>
                        <ModelInfo>
                            <ModelLabel>No models cached</ModelLabel>
                        </ModelInfo>
                    </ModelOption>
                    :
                    cached_models.map( ( model ) =>
                        <ModelOption
                            key={ model.id }
                            data-testid={ `model-option-${ model.id }` }
                            onClick={ () => handle_select( model.id ) }
                        >
                            { model.id === active_model_id ?
                                <Check size={ 14 } style={ { flexShrink: 0 } } />
                                :
                                <div style={ { width: 14 } } /> }
                            <ModelInfo>
                                <ModelLabel>{ model.name }</ModelLabel>
                                <ModelMeta>
                                    { [ model.parameters_label, model.quantization, format_file_size( model.file_size_bytes ) ].filter( Boolean ).join( ` · ` ) }
                                </ModelMeta>
                            </ModelInfo>
                        </ModelOption>
                    ) }

                <Divider />

                <ActionOption onClick={ handle_add }>
                    <Plus size={ 14 } />
                    Add Model
                </ActionOption>

                <ActionOption onClick={ handle_manage }>
                    <Settings size={ 14 } />
                    Manage Models
                </ActionOption>

            </Dropdown> }

    </Container>

}
