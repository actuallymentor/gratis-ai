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
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
`

/**
 * Download page - shows model download progress
 * @returns {JSX.Element}
 */
export default function DownloadPage() {

    return <Container>
        <Title>Downloading Model...</Title>
        <div data-testid="download-progress-bar">Progress placeholder</div>
    </Container>

}
