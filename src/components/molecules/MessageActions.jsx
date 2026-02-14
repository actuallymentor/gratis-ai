import styled from 'styled-components'
import { Copy, RefreshCw, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const ActionsBar = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
    top: -28px;
    right: 0;
`

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    background: ${ ( { theme } ) => theme.colors.surface };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    transition: all 0.2s;

    &:hover {
        color: ${ ( { theme } ) => theme.colors.text };
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

/**
 * Hover action bar for messages (copy, regenerate, edit)
 * @param {Object} props
 * @param {string} props.content - Message text content
 * @param {boolean} props.can_regenerate - Show regenerate button
 * @param {boolean} props.can_edit - Show edit button
 * @param {Function} props.on_regenerate - Regenerate handler
 * @param {Function} props.on_edit - Edit handler
 * @returns {JSX.Element}
 */
export default function MessageActions( { content, can_regenerate, can_edit, on_regenerate, on_edit } ) {

    const handle_copy = async () => {
        try {
            await navigator.clipboard.writeText( content )
            toast.success( `Copied to clipboard` )
        } catch {
            toast.error( `Failed to copy` )
        }
    }

    return <ActionsBar className="message-actions">
        <ActionButton
            data-testid="message-copy-btn"
            onClick={ handle_copy }
            aria-label="Copy message"
        >
            <Copy size={ 14 } />
        </ActionButton>

        { can_regenerate && <ActionButton
            data-testid="message-regenerate-btn"
            onClick={ on_regenerate }
            aria-label="Regenerate response"
        >
            <RefreshCw size={ 14 } />
        </ActionButton> }

        { can_edit && <ActionButton
            data-testid="message-edit-btn"
            onClick={ on_edit }
            aria-label="Edit message"
        >
            <Pencil size={ 14 } />
        </ActionButton> }
    </ActionsBar>

}
