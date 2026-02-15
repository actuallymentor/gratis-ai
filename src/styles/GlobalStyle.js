import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`

    *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    html {
        color-scheme: ${ ( { theme } ) => theme.mode };
        font-size: 100%;
        scroll-behavior: smooth;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    @media ( prefers-reduced-motion: reduce ) {
        html { scroll-behavior: auto; }

        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }

    body {
        font-family: ${ ( { theme } ) => theme.fonts.body };
        font-size: clamp( 1rem, 0.9rem + 0.5vw, 1.25rem );
        background: ${ ( { theme } ) => theme.colors.background };
        color: ${ ( { theme } ) => theme.colors.text };
        line-height: 1.5;
        letter-spacing: 0.012em;
        word-spacing: 0.16em;
        min-height: 100vh;
        overflow: hidden;
    }

    #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    a {
        color: currentColor;
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

    /* Subtle selection — accent used sparingly */
    ::selection {
        background: ${ ( { theme } ) => theme.colors.accent };
        color: white;
    }

    /* Focus indicators — never outline: none */
    :focus-visible {
        outline: 3px solid ${ ( { theme } ) => theme.colors.accent };
        outline-offset: 2px;
    }

    :focus:not( :focus-visible ) {
        outline: none;
    }

    /* Scrollbar styling — thin and subtle */
    ::-webkit-scrollbar {
        width: 4px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: ${ ( { theme } ) => theme.colors.text_muted };
        border-radius: 2px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: ${ ( { theme } ) => theme.colors.text_secondary };
    }

    /* Forced colors support */
    @media ( forced-colors: active ) {
        button {
            border: 1px solid ButtonText;
        }
    }
`

export default GlobalStyle
