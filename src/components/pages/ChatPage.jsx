import styled from 'styled-components'
import AppLayout from '../molecules/AppLayout'

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
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
 * Main chat interface page with layout shell
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {string} props.theme_mode - Resolved theme mode
 * @param {Function} props.on_theme_toggle - Handler for theme cycling
 * @returns {JSX.Element}
 */
export default function ChatPage( { theme_preference, theme_mode, on_theme_toggle } ) {

    return <AppLayout
        theme_preference={ theme_preference }
        theme_mode={ theme_mode }
        on_theme_toggle={ on_theme_toggle }
    >
        <EmptyState>
            <Title>localLM</Title>
            <Subtitle>Ask me anything.</Subtitle>
        </EmptyState>
    </AppLayout>

}
