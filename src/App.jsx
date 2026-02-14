import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { Toaster } from 'react-hot-toast'
import GlobalStyle from './styles/GlobalStyle'
import use_theme from './hooks/use_theme'
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

    const { theme, theme_preference, set_theme_preference } = use_theme()

    return <ThemeProvider theme={ theme }>
        <GlobalStyle />
        <Router>
            <QueryParamProvider adapter={ ReactRouter6Adapter }>
                <Routes
                    theme_preference={ theme_preference }
                    theme_mode={ theme.mode }
                    on_theme_toggle={ set_theme_preference }
                />
                <Toaster
                    position="bottom-center"
                    toastOptions={ {
                        duration: 3000,
                        style: {
                            background: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${ theme.colors.border }`,
                        },
                    } }
                />
            </QueryParamProvider>
        </Router>
    </ThemeProvider>

}
