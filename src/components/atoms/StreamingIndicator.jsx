import styled, { keyframes } from 'styled-components'

const blink = keyframes`
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
`

const Cursor = styled.span`
    display: inline-block;
    width: 2px;
    height: 1em;
    background: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-left: 2px;
    animation: ${ blink } 1s infinite;
    vertical-align: text-bottom;
`

/**
 * Blinking cursor shown during streaming generation
 * @returns {JSX.Element}
 */
export default function StreamingIndicator() {
    return <Cursor />
}
