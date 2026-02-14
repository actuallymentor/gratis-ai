import styled from 'styled-components'
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

const ConversationList = styled.div`
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

/**
 * Sidebar with chat history and new chat button
 * @param {Object} props
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.on_toggle - Handler for toggling sidebar
 * @param {Function} props.on_new_chat - Handler for creating new chat
 * @returns {JSX.Element}
 */
export default function Sidebar( { collapsed, on_toggle, on_new_chat } ) {

    const navigate = useNavigate()

    const handle_new_chat = () => {
        if( on_new_chat ) on_new_chat()
        navigate( `/chat` )
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

        <ConversationList>
            <EmptyState>No conversations yet</EmptyState>
        </ConversationList>

    </SidebarContainer>

}
