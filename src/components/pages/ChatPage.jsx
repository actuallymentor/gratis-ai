import styled from 'styled-components'

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
    color: ${ ( { theme } ) => theme.colors.primary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

/**
 * Main chat interface page
 * @returns {JSX.Element}
 */
export default function ChatPage() {

    return <Container>
        <Title>localLM</Title>
        <Subtitle>Ask me anything.</Subtitle>
    </Container>

}
