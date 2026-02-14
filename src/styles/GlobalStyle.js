import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`

    *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    html {
        color-scheme: ${ ( { theme } ) => theme.mode };
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    body {
        font-family: ${ ( { theme } ) => theme.fonts.body };
        background: ${ ( { theme } ) => theme.colors.background };
        color: ${ ( { theme } ) => theme.colors.text };
        line-height: 1.6;
        min-height: 100vh;
        overflow: hidden;
    }

    #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    a {
        color: ${ ( { theme } ) => theme.colors.primary };
        text-decoration: none;
    }

    button {
        cursor: pointer;
        border: none;
        background: none;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
    }

    input, textarea, select {
        font-family: inherit;
        font-size: inherit;
    }

    code, pre {
        font-family: ${ ( { theme } ) => theme.fonts.mono };
    }

    ::selection {
        background: ${ ( { theme } ) => theme.colors.primary };
        color: white;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: ${ ( { theme } ) => theme.colors.text_muted };
        border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: ${ ( { theme } ) => theme.colors.text_secondary };
    }
`

export default GlobalStyle
