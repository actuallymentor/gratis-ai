import { useState } from 'react'
import styled from 'styled-components'
import { Plus, PanelLeftClose, PanelLeft, Download, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { truncate } from '../../utils/format'

const SidebarContainer = styled.aside`
    display: flex;
    flex-direction: column;
    width: ${ ( { $collapsed } ) => $collapsed ? `0px` : `260px` };
    min-width: ${ ( { $collapsed } ) => $collapsed ? `0px` : `260px` };
    background: ${ ( { theme } ) => theme.colors.sidebar };
    border-right: 1px solid ${ ( { theme } ) => theme.colors.border };
    transition: all 0.2s ease;
    overflow: hidden;
    height: 100%;

    @media ( max-width: ${ ( { theme } ) => theme.breakpoints.mobile } ) {
        position: absolute;
        z-index: 100;
        height: 100%;
        width: ${ ( { $collapsed } ) => $collapsed ? `0px` : `260px` };
    }
`

const SidebarHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border };
    min-height: 56px;
`

const NewChatButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.sm }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.text };
    font-size: 0.85rem;
    transition: background 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const CollapseButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    transition: all 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
        color: ${ ( { theme } ) => theme.colors.text };
    }
`

const ConversationListContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: ${ ( { theme } ) => theme.spacing.xs };
`

const EmptyState = styled.div`
    padding: ${ ( { theme } ) => theme.spacing.lg };
    text-align: center;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    font-size: 0.85rem;
`

const ConversationItem = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.sm }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    text-align: left;
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text };
    background: ${ ( { $active, theme } ) => $active ? theme.colors.surface_hover : `transparent` };
    transition: background 0.15s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }

    &:hover .conv-actions {
        opacity: 1;
    }
`

const ConversationTitle = styled.span`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

const ConversationActions = styled.div`
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.15s;
`

const ActionIcon = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    color: ${ ( { theme } ) => theme.colors.text_secondary };

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface };
        color: ${ ( { theme } ) => theme.colors.text };
    }
`

/**
 * Sidebar with chat history and new chat button
 * @param {Object} props
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.on_toggle - Handler for toggling sidebar
 * @param {Function} props.on_new_chat - Handler for creating new chat
 * @param {Array} props.conversations - Array of conversation objects
 * @param {Function} props.on_export - Handler for exporting a conversation
 * @param {Function} props.on_delete - Handler for deleting a conversation
 * @returns {JSX.Element}
 */
export default function Sidebar( { collapsed, on_toggle, on_new_chat, conversations = [], on_export, on_delete } ) {

    const navigate = useNavigate()
    const { id: active_id } = useParams()
    const [ confirming_delete, set_confirming_delete ] = useState( null )

    const handle_new_chat = () => {
        if( on_new_chat ) on_new_chat()
        navigate( `/chat` )
    }

    const handle_click_conversation = ( id ) => {
        navigate( `/chat/${ id }` )
    }

    const handle_export = ( e, conversation ) => {
        e.stopPropagation()
        if( on_export ) on_export( conversation )
    }

    const handle_delete = ( e, id ) => {
        e.stopPropagation()
        if( confirming_delete === id ) {
            // Second click confirms
            if( on_delete ) on_delete( id )
            set_confirming_delete( null )
        } else {
            // First click — ask to confirm
            set_confirming_delete( id )
            // Reset after 3 seconds if not confirmed
            setTimeout( () => set_confirming_delete( null ), 3000 )
        }
    }

    return <SidebarContainer $collapsed={ collapsed }>

        <SidebarHeader>
            <NewChatButton
                data-testid="new-chat-btn"
                onClick={ handle_new_chat }
            >
                <Plus size={ 16 } />
                New Chat
            </NewChatButton>

            <CollapseButton onClick={ on_toggle } aria-label="Toggle sidebar">
                { collapsed ? <PanelLeft size={ 18 } /> : <PanelLeftClose size={ 18 } /> }
            </CollapseButton>
        </SidebarHeader>

        <ConversationListContainer>

            { conversations.length === 0 ?
                <EmptyState>No conversations yet</EmptyState>
                :
                conversations.map( ( conv ) =>
                    <ConversationItem
                        key={ conv.id }
                        data-testid={ `sidebar-conversation-${ conv.id }` }
                        $active={ conv.id === active_id }
                        onClick={ () => handle_click_conversation( conv.id ) }
                    >
                        <ConversationTitle>
                            { truncate( conv.title, 40 ) }
                        </ConversationTitle>

                        <ConversationActions className="conv-actions">
                            <ActionIcon
                                data-testid={ `sidebar-export-${ conv.id }` }
                                onClick={ ( e ) => handle_export( e, conv ) }
                                aria-label="Export conversation"
                            >
                                <Download size={ 14 } />
                            </ActionIcon>
                            <ActionIcon
                                data-testid={ `sidebar-delete-${ conv.id }` }
                                onClick={ ( e ) => handle_delete( e, conv.id ) }
                                aria-label={ confirming_delete === conv.id ? `Confirm delete` : `Delete conversation` }
                                style={ confirming_delete === conv.id ? { color: `var(--error, #ef4444)` } : {} }
                            >
                                <Trash2 size={ 14 } />
                            </ActionIcon>
                        </ConversationActions>
                    </ConversationItem>
                ) }

        </ConversationListContainer>

    </SidebarContainer>

}
