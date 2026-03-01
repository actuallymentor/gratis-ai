import styled, { keyframes } from 'styled-components'
import { useTranslation } from 'react-i18next'


const pulse = keyframes`
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
`

const Container = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.82rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const Dot = styled.span`
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${ ( { theme } ) => theme.colors.text_muted };
    animation: ${ pulse } 1.4s ease-in-out infinite;
    animation-delay: ${ ( { $delay } ) => $delay }s;
`


/**
 * Animated "Waking up the AI" indicator shown between
 * pressing send and the first token arriving (TTFT gap).
 */
export default function WakingUpIndicator() {

    const { t } = useTranslation( `chat` )

    return <Container>
        { t( `waking_up` ) }
        <Dot $delay={ 0 } />
        <Dot $delay={ 0.2 } />
        <Dot $delay={ 0.4 } />
    </Container>

}
