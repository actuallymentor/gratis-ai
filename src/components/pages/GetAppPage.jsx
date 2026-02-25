import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Apple, Monitor, Terminal } from 'lucide-react'
import { DISPLAY_NAME } from '../../utils/branding'

const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || ``
const RELEASES_URL = GITHUB_REPO
    ? `https://github.com/${ GITHUB_REPO }/releases/latest`
    : ``

// ── OS detection ────────────────────────────────────────────────

const detect_os = () => {
    const ua = navigator.userAgent || ``
    const platform = navigator.platform || ``
    if( /Mac/i.test( platform ) || /Mac/i.test( ua ) ) return `macos`
    if( /Win/i.test( platform ) || /Win/i.test( ua ) ) return `windows`
    return `linux`
}

// ── Platform metadata ───────────────────────────────────────────

const PLATFORMS = [
    {
        id: `macos`,
        label: `macOS`,
        detail: `Universal (Apple Silicon & Intel)`,
        file_hint: `.dmg`,
        Icon: Apple,
    },
    {
        id: `windows`,
        label: `Windows`,
        detail: `64-bit (x64)`,
        file_hint: `.exe`,
        Icon: Monitor,
    },
    {
        id: `linux`,
        label: `Linux`,
        detail: `AppImage (x64)`,
        file_hint: `.AppImage`,
        Icon: Terminal,
    },
]

// ── Styled components ───────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
`

const Title = styled.h1`
    font-size: clamp( 2rem, 1.5rem + 2.5vw, 3rem );
    font-weight: 700;
    color: ${ ( { theme } ) => theme.colors.text };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const Tagline = styled.p`
    font-size: clamp( 1rem, 0.9rem + 0.3vw, 1.2rem );
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    max-width: 460px;
    line-height: 1.6;
`

const CardGrid = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.md };
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    max-width: 720px;
    width: 100%;
`

const Card = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding: ${ ( { theme } ) => theme.spacing.lg };
    border: 2px solid ${ ( { theme, $active } ) =>
        $active ? theme.colors.accent : theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    background: ${ ( { theme } ) => theme.colors.surface };
    min-width: 180px;
    flex: 1;
    max-width: 220px;

    ${ ( { $active, theme } ) => $active && `
        box-shadow: 0 0 0 1px ${ theme.colors.accent };
    ` }
`

const PlatformIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme } ) => theme.colors.code_background };
    color: ${ ( { theme } ) => theme.colors.text };
`

const PlatformName = styled.span`
    font-size: 1.1rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.text };
`

const PlatformDetail = styled.span`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const DownloadButton = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.accent };
    color: #fff;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    width: 100%;
    min-height: 2.5rem;
    transition: opacity 0.15s;

    &:hover { opacity: 0.85; }
`

const DisabledButton = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.border };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.875rem;
    width: 100%;
    min-height: 2.5rem;
    cursor: default;
`

const YourOS = styled.span`
    font-size: 0.75rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.accent };
    text-transform: uppercase;
    letter-spacing: 0.05em;
`

const BackButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    font-size: 0.9rem;
    transition: color 0.15s;
    min-height: 2.75rem;

    &:hover { color: ${ ( { theme } ) => theme.colors.text }; }
`

const Notice = styled.p`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
    max-width: 400px;
    line-height: 1.5;
`

// ── Component ───────────────────────────────────────────────────

/**
 * Download page with OS-specific release links.
 * Detects the user's OS and highlights the matching platform card.
 * @returns {JSX.Element}
 */
export default function GetAppPage() {

    const navigate = useNavigate()
    const current_os = detect_os()

    return <Container>

        <Title>{ DISPLAY_NAME }</Title>
        <Tagline>
            Download the desktop app for faster, fully-offline AI
            powered by your own hardware.
        </Tagline>

        <CardGrid>
            { PLATFORMS.map( ( { id, label, detail, file_hint, Icon } ) => {

                const is_current = id === current_os

                return <Card key={ id } $active={ is_current }>

                    { is_current && <YourOS>Your OS</YourOS> }

                    <PlatformIcon>
                        <Icon size={ 22 } />
                    </PlatformIcon>

                    <PlatformName>{ label }</PlatformName>
                    <PlatformDetail>{ detail } ({ file_hint })</PlatformDetail>

                    { RELEASES_URL
                        ? <DownloadButton
                            href={ RELEASES_URL }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Download for { label }
                        </DownloadButton>
                        : <DisabledButton>Not configured</DisabledButton> }

                </Card>

            } ) }
        </CardGrid>

        { !RELEASES_URL && <Notice>
            Release downloads are not configured for this deployment.
            Build the desktop app from source or check the project repository.
        </Notice> }

        <BackButton onClick={ () => navigate( `/chat` ) }>
            <ArrowLeft size={ 16 } />
            Or continue in your browser
        </BackButton>

    </Container>

}
