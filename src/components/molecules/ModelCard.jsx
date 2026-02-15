import styled from 'styled-components'
import { format_file_size } from '../../providers/model_registry'

const Card = styled.div`
    background: transparent;
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-left: 3px solid ${ ( { theme, $selected } ) =>
        $selected ? theme.colors.accent : theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    padding: ${ ( { theme } ) => theme.spacing.lg };
    cursor: pointer;
    transition: border-color 0.15s;
    max-width: 400px;
    width: 100%;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.text_muted };
    }
`

const ModelName = styled.h3`
    font-size: 1.1rem;
    font-weight: ${ ( { $selected } ) => $selected ? `600` : `500` };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xs };
`

const ModelDescription = styled.p`
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const MetaRow = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    flex-wrap: wrap;
`

const MetaItem = styled.span`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    background: ${ ( { theme } ) => theme.colors.code_background };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.sm }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
`

/**
 * Card displaying model details for selection
 * @param {Object} props
 * @param {import('../../providers/model_registry').ModelDefinition} props.model
 * @param {boolean} props.selected
 * @param {Function} props.on_select
 * @returns {JSX.Element}
 */
export default function ModelCard( { model, selected, on_select } ) {

    return <Card $selected={ selected } onClick={ () => on_select( model ) }>
        <ModelName $selected={ selected }>{ model.name }</ModelName>
        <ModelDescription>{ model.description }</ModelDescription>
        <MetaRow>
            <MetaItem>{ model.parameters_label }</MetaItem>
            <MetaItem>{ model.quantization }</MetaItem>
            <MetaItem>{ format_file_size( model.file_size_bytes ) }</MetaItem>
            <MetaItem>ctx: { model.context_length.toLocaleString() }</MetaItem>
        </MetaRow>
    </Card>

}
