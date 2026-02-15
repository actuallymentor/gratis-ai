import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import SettingsModal from './SettingsModal'

const LayoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
`

const MainArea = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
`

const ContentArea = styled.main`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`

/**
 * Shell layout wrapping sidebar + content with top bar
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.theme_preference - Current theme preference
 * @param {string} props.theme_mode - Resolved theme mode
 * @param {Function} props.on_theme_toggle - Handler for theme cycling
 * @param {Function} props.on_new_chat - Handler for new chat creation
 * @param {Array} props.conversations - Array of conversation objects for sidebar
 * @param {Function} props.on_export - Handler for exporting a conversation
 * @param {Function} props.on_delete - Handler for deleting a conversation
 * @param {Function} props.on_delete_all - Handler for wiping all conversations
 * @param {Array} props.cached_models - Cached model metadata for model selector
 * @param {string} props.active_model_id - Currently active model ID
 * @param {boolean} props.is_model_switching - Whether model switch is in progress
 * @param {Function} props.on_model_switch - Handler for switching models
 * @returns {JSX.Element}
 */
export default function AppLayout( {
    children, theme_preference, theme_mode, on_theme_toggle, on_new_chat,
    conversations, on_export, on_delete, on_delete_all,
    cached_models, active_model_id, is_model_switching, on_model_switch,
} ) {

    const [ sidebar_collapsed, set_sidebar_collapsed ] = useState( () =>
        typeof window !== `undefined` && window.innerWidth < 768
    )
    const [ settings_open, set_settings_open ] = useState( false )

    // Respond to viewport changes
    useEffect( () => {

        const handle_resize = () => {
            if( window.innerWidth < 768 ) set_sidebar_collapsed( true )
        }

        window.addEventListener( `resize`, handle_resize )
        return () => window.removeEventListener( `resize`, handle_resize )

    }, [] )

    // Listen for global keyboard shortcut events
    useEffect( () => {

        const handle_open_settings = () => set_settings_open( true )
        const handle_toggle_sidebar = () => set_sidebar_collapsed( prev => !prev )

        window.addEventListener( `locallm:open-settings`, handle_open_settings )
        window.addEventListener( `locallm:toggle-sidebar`, handle_toggle_sidebar )
        return () => {
            window.removeEventListener( `locallm:open-settings`, handle_open_settings )
            window.removeEventListener( `locallm:toggle-sidebar`, handle_toggle_sidebar )
        }

    }, [] )

    const toggle_sidebar = () => set_sidebar_collapsed( prev => !prev )
    const close_settings = useCallback( () => set_settings_open( false ), [] )

    return <LayoutContainer>

        <TopBar
            theme_preference={ theme_preference }
            theme_mode={ theme_mode }
            on_theme_toggle={ on_theme_toggle }
            on_settings_open={ () => set_settings_open( true ) }
            sidebar_collapsed={ sidebar_collapsed }
            on_toggle_sidebar={ toggle_sidebar }
            cached_models={ cached_models }
            active_model_id={ active_model_id }
            is_model_switching={ is_model_switching }
            on_model_switch={ on_model_switch }
        />

        <MainArea>
            <Sidebar
                collapsed={ sidebar_collapsed }
                on_toggle={ toggle_sidebar }
                on_new_chat={ on_new_chat }
                conversations={ conversations }
                on_export={ on_export }
                on_delete={ on_delete }
                on_delete_all={ on_delete_all }
            />
            <ContentArea>
                { children }
            </ContentArea>
        </MainArea>

        <SettingsModal
            is_open={ settings_open }
            on_close={ close_settings }
            theme_preference={ theme_preference }
            on_theme_change={ on_theme_toggle }
            on_model_switch={ on_model_switch }
        />

    </LayoutContainer>

}
