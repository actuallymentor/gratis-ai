import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const DISMISSED_KEY = `slow_device_warning_dismissed`
const SLOW_THRESHOLD = 2 // tok/s


const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    margin-top: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.78rem;
    line-height: 1.4;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    background: ${ ( { theme } ) => theme.colors.code_background };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    border-left: 3px solid ${ ( { theme } ) => theme.colors.accent };
`

const IconWrap = styled.span`
    flex-shrink: 0;
    color: ${ ( { theme } ) => theme.colors.accent };
`

const AppLink = styled( Link )`
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.accent };
    text-decoration: none;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
`


/**
 * Contextual inline warning shown below GenerationStats when
 * inference speed is below the threshold — nudges web users
 * toward the faster Desktop app.
 *
 * - Only renders in browser (not Electron)
 * - Dismissed for the current session via sessionStorage
 */
export default function SlowDeviceWarning( { tokens_per_second } ) {

    const { t } = useTranslation( `chat` )

    const [ dismissed ] = useState( () =>
        sessionStorage.getItem( DISMISSED_KEY ) === `true`
    )

    // Skip in Electron — native inference is already the fast path
    if( window.electronAPI?.native_inference ) return null

    // Only show for genuinely slow inference
    if( !tokens_per_second || tokens_per_second >= SLOW_THRESHOLD ) return null

    // Once per session
    if( dismissed ) return null

    // Mark as shown so it won't appear again this session
    sessionStorage.setItem( DISMISSED_KEY, `true` )

    return <Container data-testid="slow-device-warning">

        <IconWrap><Monitor size={ 14 } /></IconWrap>

        <span>
            { t( `slow_device_warning` ) }
            { ` ` }
            <AppLink to="/get-app">{ t( `get_the_desktop_app` ) }</AppLink>
        </span>

    </Container>

}
