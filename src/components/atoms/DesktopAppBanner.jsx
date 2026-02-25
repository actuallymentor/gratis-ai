import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Monitor, X } from 'lucide-react'
import { storage_key } from '../../utils/branding'

const DISMISSED_KEY = storage_key( `desktop_banner_dismissed` )

const Banner = styled.div`
    display: flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.sm };
    padding: ${ p => p.theme.spacing.xs } ${ p => p.theme.spacing.md };
    background: ${ p => p.theme.colors.accent };
    color: #fff;
    font-size: 0.8125rem;
    line-height: 1.4;
    min-height: 2rem;
`

const Message = styled.span`
    flex: 1;
    display: flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.sm };
`

const AppLink = styled( Link )`
    display: inline-flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.xs };
    padding: 0.15rem ${ p => p.theme.spacing.sm };
    background: rgba( 255, 255, 255, 0.2 );
    color: #fff;
    border-radius: ${ p => p.theme.border_radius.sm };
    font-size: 0.8125rem;
    text-decoration: none;
    white-space: nowrap;

    &:hover { background: rgba( 255, 255, 255, 0.3 ); }
`

const DismissButton = styled.button`
    display: inline-flex;
    align-items: center;
    padding: 0.15rem;
    background: none;
    color: rgba( 255, 255, 255, 0.7 );
    border: none;
    cursor: pointer;
    border-radius: ${ p => p.theme.border_radius.sm };

    &:hover { color: #fff; }
`

/**
 * Slim promo banner encouraging web users to try the desktop app.
 * Hidden in Electron and once dismissed (persisted to localStorage).
 * @returns {JSX.Element|null}
 */
export default function DesktopAppBanner() {

    const [ dismissed, set_dismissed ] = useState( () =>
        localStorage.getItem( DISMISSED_KEY ) === `true`
    )

    // Hide in Electron — native inference means the desktop app is already running
    if( window.electronAPI?.native_inference ) return null

    if( dismissed ) return null

    const dismiss = () => {
        localStorage.setItem( DISMISSED_KEY, `true` )
        set_dismissed( true )
    }

    return <Banner>

        <DismissButton onClick={ dismiss } aria-label="Dismiss">
            <X size={ 14 } />
        </DismissButton>

        <Message>
            <Monitor size={ 14 } />
            Get more power with the same privacy — try the desktop app
        </Message>

        <AppLink to="/get-app">Get the app</AppLink>

    </Banner>

}
