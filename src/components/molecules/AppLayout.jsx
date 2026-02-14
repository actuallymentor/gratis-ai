import { useState, useEffect } from 'react'
import styled from 'styled-components'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

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
 * @returns {JSX.Element}
 */
export default function AppLayout( { children, theme_preference, theme_mode, on_theme_toggle, on_new_chat } ) {

    // Detect mobile viewport for initial sidebar state
    const [ sidebar_collapsed, set_sidebar_collapsed ] = useState( () =>
        typeof window !== `undefined` && window.innerWidth < 768
    )

    // Respond to viewport changes
    useEffect( () => {

        const handle_resize = () => {
            if( window.innerWidth < 768 ) set_sidebar_collapsed( true )
        }

        window.addEventListener( `resize`, handle_resize )
        return () => window.removeEventListener( `resize`, handle_resize )

    }, [] )

    const toggle_sidebar = () => set_sidebar_collapsed( prev => !prev )

    return <LayoutContainer>

        <TopBar
            theme_preference={ theme_preference }
            theme_mode={ theme_mode }
            on_theme_toggle={ on_theme_toggle }
            on_settings_open={ () => {} }
        />

        <MainArea>
            <Sidebar
                collapsed={ sidebar_collapsed }
                on_toggle={ toggle_sidebar }
                on_new_chat={ on_new_chat }
            />
            <ContentArea>
                { children }
            </ContentArea>
        </MainArea>

    </LayoutContainer>

}
