import { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format_file_size } from '../../providers/model_registry'
import use_model_manager from '../../hooks/use_model_manager'
import { clear_all_data, get_db } from '../../stores/db'
import { export_conversation } from '../../utils/export'

const Section = styled.div`
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
`

const SectionTitle = styled.h3`
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const Description = styled.p`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const StorageSummary = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.md };
    padding: ${ ( { theme } ) => theme.spacing.sm };
    background: ${ ( { theme } ) => theme.colors.code_background };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.8rem;
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const StorageStat = styled.div`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

const ModelList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const ModelItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
`

const ModelInfo = styled.div`
    flex: 1;
    min-width: 0;
`

const ModelName = styled.div`
    font-weight: 500;
    font-size: 0.9rem;
`

const ModelMeta = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const Badge = styled.span`
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: ${ ( { theme } ) => theme.spacing.xs };
    background: ${ ( { theme, $variant } ) =>
        $variant === `active` ? theme.colors.primary + `30` : theme.colors.surface_hover };
    color: ${ ( { theme, $variant } ) =>
        $variant === `active` ? theme.colors.primary : theme.colors.text_secondary };
`

const ModelActions = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const SmallButton = styled.button`
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.sm }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    font-size: 0.75rem;
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    transition: all 0.15s;

    &:hover:not(:disabled) {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`

const DeleteButton = styled( SmallButton )`
    border-color: ${ ( { theme } ) => theme.colors.error };
    color: ${ ( { theme } ) => theme.colors.error };

    &:hover:not(:disabled) {
        background: ${ ( { theme } ) => theme.colors.error };
        color: white;
    }
`

const EmptyState = styled.div`
    text-align: center;
    padding: ${ ( { theme } ) => theme.spacing.lg };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    font-size: 0.85rem;
`

const ButtonRow = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    flex-wrap: wrap;
`

const Button = styled.button`
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    color: ${ ( { theme } ) => theme.colors.text };
    transition: all 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const DangerZone = styled.div`
    border-top: 2px solid ${ ( { theme } ) => theme.colors.error };
    padding-top: ${ ( { theme } ) => theme.spacing.md };
    margin-top: ${ ( { theme } ) => theme.spacing.xl };
`

const DangerButton = styled( Button )`
    border-color: ${ ( { theme } ) => theme.colors.error };
    color: ${ ( { theme } ) => theme.colors.error };

    &:hover {
        background: ${ ( { theme } ) => theme.colors.error };
        color: white;
    }
`

/**
 * Models settings tab with cached model management and danger zone
 * @param {Object} props
 * @param {Function} props.on_close - Handler to close settings modal
 * @param {Function} props.on_model_switch - Handler for switching models
 * @returns {JSX.Element}
 */
export default function ModelsSettings( { on_close, on_model_switch } ) {

    const navigate = useNavigate()
    const { cached_models, storage_used, storage_estimate, delete_model } = use_model_manager()
    const [ confirming, set_confirming ] = useState( null )
    const active_model_id = localStorage.getItem( `locallm:settings:active_model_id` )

    const handle_add_preset = () => {
        if( on_close ) on_close()
        navigate( `/select-model` )
    }

    const handle_delete = async ( model ) => {

        if( confirming !== model.id ) {
            set_confirming( model.id )
            setTimeout( () => set_confirming( null ), 5000 )
            return
        }

        try {
            await delete_model( model.id )
            set_confirming( null )
            toast.success( `Deleted ${ model.name }` )
        } catch ( err ) {
            toast.error( err.message )
        }

    }

    const handle_load = ( model_id ) => {
        if( on_model_switch ) on_model_switch( model_id )
        if( on_close ) on_close()
    }

    const handle_export_all = async () => {

        try {
            const db = await get_db()
            const conversations = await db.getAll( `conversations` )
            if( conversations.length === 0 ) {
                toast( `No conversations to export` )
                return
            }
            for( const conv of conversations ) {
                const messages = await db.getAllFromIndex( `messages`, `conversation_id`, conv.id )
                export_conversation( conv, messages )
            }
            toast.success( `Exported ${ conversations.length } conversation${ conversations.length !== 1 ? `s` : `` }` )
        } catch ( err ) {
            toast.error( `Export failed: ${ err.message }` )
        }

    }

    const handle_clear_all = async () => {

        const confirmed = confirm( `This will delete all conversations, cached models, and settings. This cannot be undone.` )
        if( !confirmed ) return

        await clear_all_data()

        // Clear all locallm localStorage keys
        const keys_to_remove = []
        for( let i = 0; i < localStorage.length; i++ ) {
            const key = localStorage.key( i )
            if( key?.startsWith( `locallm:` ) ) keys_to_remove.push( key )
        }
        keys_to_remove.forEach( ( k ) => localStorage.removeItem( k ) )

        if( on_close ) on_close()
        navigate( `/` )

    }

    return <>

        { /* Storage summary */ }
        <StorageSummary data-testid="storage-summary">
            <StorageStat>
                <strong>{ cached_models.length }</strong> model{ cached_models.length !== 1 ? `s` : `` } cached
            </StorageStat>
            <StorageStat>
                <strong>{ format_file_size( storage_used ) }</strong> used
            </StorageStat>
            { storage_estimate !== null &&
                <StorageStat>
                    <strong>{ format_file_size( storage_estimate ) }</strong> available
                </StorageStat> }
        </StorageSummary>

        { /* Cached models list */ }
        <Section>
            <SectionTitle>Cached Models</SectionTitle>
            { cached_models.length === 0 ?
                <EmptyState>No models cached yet.</EmptyState>
                :
                <ModelList>
                    { cached_models.map( ( model ) => {
                        const is_active = model.id === active_model_id
                        return <ModelItem key={ model.id } data-testid={ `cached-model-${ model.id }` }>
                            <ModelInfo>
                                <ModelName>
                                    { model.name }
                                    { is_active && <Badge $variant="active">Active</Badge> }
                                    { !is_active && <Badge>Cached</Badge> }
                                </ModelName>
                                <ModelMeta>
                                    { [ model.parameters_label, model.quantization, format_file_size( model.file_size_bytes ) ].filter( Boolean ).join( ` · ` ) }
                                </ModelMeta>
                            </ModelInfo>
                            <ModelActions>
                                <SmallButton
                                    data-testid={ `model-load-btn-${ model.id }` }
                                    disabled={ is_active }
                                    onClick={ () => handle_load( model.id ) }
                                >
                                    { is_active ? `Loaded` : `Load` }
                                </SmallButton>
                                <DeleteButton
                                    data-testid={ `model-delete-btn-${ model.id }` }
                                    disabled={ is_active }
                                    onClick={ () => handle_delete( model ) }
                                >
                                    { confirming === model.id ? `Confirm?` : `Delete` }
                                </DeleteButton>
                            </ModelActions>
                        </ModelItem>
                    } ) }
                </ModelList> }
        </Section>

        { /* Add model section */ }
        <Section>
            <SectionTitle>Add Model</SectionTitle>
            <ButtonRow>
                <Button
                    data-testid="add-model-preset-btn"
                    onClick={ handle_add_preset }
                >
                    Download from Presets
                </Button>
            </ButtonRow>
        </Section>

        { /* Export all conversations */ }
        <Section>
            <SectionTitle>Data</SectionTitle>
            <ButtonRow>
                <Button
                    data-testid="export-all-btn"
                    onClick={ handle_export_all }
                >
                    Export All Conversations
                </Button>
            </ButtonRow>
        </Section>

        { /* Danger Zone */ }
        <DangerZone>
            <SectionTitle style={ { color: `inherit` } }>Danger Zone</SectionTitle>
            <Description>These actions are irreversible.</Description>
            <ButtonRow>
                <DangerButton
                    data-testid="clear-all-data-btn"
                    onClick={ handle_clear_all }
                >
                    Clear All Data
                </DangerButton>
            </ButtonRow>
        </DangerZone>

    </>

}
