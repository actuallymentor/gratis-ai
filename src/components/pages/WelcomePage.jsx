import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

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
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    max-width: 500px;
`

const StartButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.primary };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    font-size: 1.1rem;
    font-weight: 600;
    transition: background 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.primary_hover };
    }
`

/**
 * Landing page with app intro and device detection
 * @returns {JSX.Element}
 */
export default function WelcomePage() {

    const navigate = useNavigate()

    const handle_start = () => navigate( `/select-model` )

    return <Container>
        <Title>localLM</Title>
        <Tagline>Run AI locally. Your data never leaves your device.</Tagline>
        <StartButton
            data-testid="get-started-btn"
            onClick={ handle_start }
        >
            Get Started
        </StartButton>
    </Container>

}
