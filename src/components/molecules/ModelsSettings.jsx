import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { clear_all_data } from '../../stores/db'

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
 * Models settings tab — stub for Phase 10 completion
 * Includes danger zone for clearing all data
 * @param {Object} props
 * @param {Function} props.on_close - Handler to close settings modal
 * @returns {JSX.Element}
 */
export default function ModelsSettings( { on_close } ) {

    const navigate = useNavigate()

    const handle_add_preset = () => {
        if( on_close ) on_close()
        navigate( `/select-model` )
    }

    const handle_clear_all = async () => {

         
        const confirmed = confirm( `This will delete all conversations, cached models, and settings. This cannot be undone.` )
        if( !confirmed ) return

        // Clear IndexedDB
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

        { /* Cached models placeholder — completed in Phase 10 */ }
        <Section>
            <SectionTitle>Cached Models</SectionTitle>
            <EmptyState>No models cached yet.</EmptyState>
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
