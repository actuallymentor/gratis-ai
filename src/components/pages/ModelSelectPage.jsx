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
    font-size: 2rem;
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
`

const Button = styled.button`
    background: ${ ( { theme } ) => theme.colors.primary };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    font-size: 1rem;
    font-weight: 600;
    transition: background 0.2s;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.primary_hover };
    }
`

/**
 * Model selection page - recommends model tier based on device capabilities
 * @returns {JSX.Element}
 */
export default function ModelSelectPage() {

    const navigate = useNavigate()

    const handle_download = () => navigate( `/download` )

    return <Container>
        <Title>Select a Model</Title>
        <Button
            data-testid="model-select-confirm-btn"
            onClick={ handle_download }
        >
            Download & Start
        </Button>
    </Container>

}
