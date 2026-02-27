import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Monitor, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { storage_key } from '../../utils/branding'

const DISMISSED_KEY = storage_key( `desktop_banner_dismissed` )

const is_mobile_os = () => /Android|iPhone|iPad|iPod/i.test( navigator.userAgent || `` )

const Banner = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${ p => p.theme.spacing.sm };
    padding: ${ p => p.theme.spacing.xs } ${ p => p.theme.spacing.md };
    background: ${ p => p.theme.colors.accent };
    color: #fff;
    font-size: 0.8125rem;
    line-height: 1.4;
    min-height: 2rem;

    @media ( max-width: 768px ) {
        display: none;
    }
`

const Message = styled.span`
    display: flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.sm };
`

const AppLink = styled( Link )`
    display: inline-flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.xs };
    padding: 0.15rem ${ p => p.theme.spacing.sm };
    background: ${ p => p.theme.mode === `dark` ? `#fff` : `#1a1a1a` };
    color: ${ p => p.theme.mode === `dark` ? `#1a1a1a` : `#fff` };
    border-radius: ${ p => p.theme.border_radius.sm };
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover { opacity: 0.85; }
`

const DismissButton = styled.button`
    position: absolute;
    right: ${ p => p.theme.spacing.sm };
    display: inline-flex;
    align-items: center;
    padding: 0.15rem;
    background: none;
    color: rgba( 255, 255, 255, 0.5 );
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

    const { t } = useTranslation( `pages` )
    const [ dismissed, set_dismissed ] = useState( () =>
        localStorage.getItem( DISMISSED_KEY ) === `true`
    )

    // Hide in Electron — native inference means the desktop app is already running
    if( window.electronAPI?.native_inference ) return null

    // Desktop app promo is useless on mobile devices
    if( is_mobile_os() ) return null

    if( dismissed ) return null

    const dismiss = () => {
        localStorage.setItem( DISMISSED_KEY, `true` )
        set_dismissed( true )
    }

    return <Banner>

        <DismissButton onClick={ dismiss } aria-label={ t( `common:aria_dismiss` ) }>
            <X size={ 14 } />
        </DismissButton>

        <Message>
            <Monitor size={ 14 } />
            { t( `desktop_banner_text` ) }
        </Message>

        <AppLink to="/get-app">{ t( `get_the_app` ) }</AppLink>

    </Banner>

}
