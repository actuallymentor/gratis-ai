import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { Toaster } from 'react-hot-toast'
import GlobalStyle from './styles/GlobalStyle'
import { dark_theme } from './styles/theme'
import Routes from './routes/Routes'

// Choose router based on runtime environment
const is_electron = typeof window !== `undefined` && window.electronAPI?.native_inference
const Router = is_electron ? HashRouter : BrowserRouter

/**
 * Root application component
 * Sets up providers: Router, Theme, QueryParams, Toasts
 * @returns {JSX.Element}
 */
export default function App() {

    return <ThemeProvider theme={ dark_theme }>
        <GlobalStyle />
        <Router>
            <QueryParamProvider adapter={ ReactRouter6Adapter }>
                <Routes />
                <Toaster
                    position="bottom-center"
                    toastOptions={ {
                        duration: 3000,
                        style: {
                            background: dark_theme.colors.surface,
                            color: dark_theme.colors.text,
                            border: `1px solid ${ dark_theme.colors.border }`,
                        },
                    } }
                />
            </QueryParamProvider>
        </Router>
    </ThemeProvider>

}
