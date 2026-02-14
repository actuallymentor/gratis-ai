import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import use_device_capabilities from '../../hooks/use_device_capabilities'
import DeviceInfo from '../atoms/DeviceInfo'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
`

const Title = styled.h1`
    font-size: 3rem;
    font-weight: 700;
    color: ${ ( { theme } ) => theme.colors.primary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Tagline = styled.p`
    font-size: 1.25rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
    max-width: 500px;
`

const Description = styled.p`
    font-size: 0.95rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    max-width: 550px;
    line-height: 1.6;
`

const StartButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.primary };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    font-size: 1.1rem;
    font-weight: 600;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };

    &:hover {
        background: ${ ( { theme } ) => theme.colors.primary_hover };
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`

const Spinner = styled( Loader2 )`
    animation: spin 1s linear infinite;
    @keyframes spin {
        from { transform: rotate( 0deg ); }
        to { transform: rotate( 360deg ); }
    }
`

/**
 * Landing page with app intro and device detection
 * @returns {JSX.Element}
 */
export default function WelcomePage() {

    const navigate = useNavigate()
    const { capabilities, is_detecting } = use_device_capabilities()

    const handle_start = () => {
        if( !is_detecting ) navigate( `/select-model`, { state: { capabilities } } )
    }

    return <Container>

        <Title>localLM</Title>
        <Tagline>Run AI locally. Your data never leaves your device.</Tagline>
        <Description>
            localLM runs open-source AI models entirely on your device using WebAssembly.
            Your conversations are private, fast, and work offline after the initial model download.
        </Description>

        { /* Show detected capabilities */ }
        <DeviceInfo capabilities={ capabilities } />

        <StartButton
            data-testid="get-started-btn"
            onClick={ handle_start }
            disabled={ is_detecting }
        >
            { is_detecting && <Spinner size={ 18 } /> }
            { is_detecting ? `Detecting device...` : `Get Started` }
        </StartButton>

    </Container>

}
