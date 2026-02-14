import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { X } from 'lucide-react'
import BasicSettings from './BasicSettings'
import AdvancedSettings from './AdvancedSettings'
import ModelsSettings from './ModelsSettings'
import use_settings from '../../hooks/use_settings'

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba( 0, 0, 0, 0.5 );
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`

const Modal = styled.div`
    background: ${ ( { theme } ) => theme.colors.background };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    width: min( 560px, 90vw );
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
    width: 32px;
    height: 32px;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.text_secondary };

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
        color: ${ ( { theme } ) => theme.colors.text };
    }
`

const TabBar = styled.div`
    display: flex;
    border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border };
`

const Tab = styled.button`
    flex: 1;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    font-size: 0.85rem;
    font-weight: 500;
    color: ${ ( { theme, $active } ) => $active ? theme.colors.primary : theme.colors.text_secondary };
    border-bottom: 2px solid ${ ( { theme, $active } ) => $active ? theme.colors.primary : `transparent` };
    transition: all 0.2s;

    &:hover {
        color: ${ ( { theme } ) => theme.colors.text };
    }
`

const Body = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: ${ ( { theme } ) => theme.spacing.md };
`

const TABS = [
    { id: `basic`, label: `Basic` },
    { id: `advanced`, label: `Advanced` },
    { id: `models`, label: `Models` },
]

/**
 * Settings modal with three tabs
 * @param {Object} props
 * @param {boolean} props.is_open - Whether the modal is open
 * @param {Function} props.on_close - Handler for closing the modal
 * @param {string} props.theme_preference - Current theme preference
 * @param {Function} props.on_theme_change - Handler for theme changes
 * @returns {JSX.Element|null}
 */
export default function SettingsModal( { is_open, on_close, theme_preference, on_theme_change } ) {

    const [ active_tab, set_active_tab ] = useState( `basic` )
    const { settings, update_setting } = use_settings()

    // Listen for global close-modal events (Escape key)
    useEffect( () => {

        const handle_close = () => {
            if( is_open ) on_close()
        }
        window.addEventListener( `locallm:close-modal`, handle_close )
        return () => window.removeEventListener( `locallm:close-modal`, handle_close )

    }, [ is_open, on_close ] )

    if( !is_open ) return null

    // Close on backdrop click
    const handle_overlay_click = ( e ) => {
        if( e.target === e.currentTarget ) on_close()
    }

    return <Overlay data-testid="settings-modal" onClick={ handle_overlay_click }>
        <Modal>

            <Header>
                <Title>Settings</Title>
                <CloseButton onClick={ on_close } aria-label="Close settings">
                    <X size={ 18 } />
                </CloseButton>
            </Header>

            <TabBar>
                { TABS.map( ( tab ) =>
                    <Tab
                        key={ tab.id }
                        data-testid={ `settings-tab-${ tab.id }` }
                        $active={ active_tab === tab.id }
                        onClick={ () => set_active_tab( tab.id ) }
                    >
                        { tab.label }
                    </Tab>
                ) }
            </TabBar>

            <Body>
                { active_tab === `basic` &&
                    <BasicSettings
                        theme_preference={ theme_preference }
                        on_theme_change={ on_theme_change }
                        temperature={ settings.temperature }
                        on_temperature_change={ ( v ) => update_setting( `temperature`, v ) }
                        max_tokens={ settings.max_tokens }
                        on_max_tokens_change={ ( v ) => update_setting( `max_tokens`, v ) }
                        system_prompt={ settings.system_prompt }
                        on_system_prompt_change={ ( v ) => update_setting( `system_prompt`, v ) }
                    /> }

                { active_tab === `advanced` &&
                    <AdvancedSettings
                        settings={ settings }
                        on_change={ update_setting }
                    /> }

                { active_tab === `models` &&
                    <ModelsSettings on_close={ on_close } /> }
            </Body>

        </Modal>
    </Overlay>

}
