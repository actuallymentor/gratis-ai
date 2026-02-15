import { lazy, Suspense } from 'react'
import { Routes as RouterRoutes, Route } from 'react-router-dom'
import { prefetch } from 'less-lazy'

// Lazy load all pages with prefetching for code splitting
const WelcomePage = lazy( prefetch( () => import( '../components/pages/WelcomePage' ) ) )
const ModelSelectPage = lazy( prefetch( () => import( '../components/pages/ModelSelectPage' ) ) )
const DownloadPage = lazy( prefetch( () => import( '../components/pages/DownloadPage' ) ) )
const ChatPage = lazy( prefetch( () => import( '../components/pages/ChatPage' ) ) )
const NotFoundPage = lazy( prefetch( () => import( '../components/pages/NotFoundPage' ) ) )

/**
 * Application route definitions
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {string} props.theme_mode - Resolved theme mode
 * @param {Function} props.on_theme_toggle - Handler for theme cycling
 * @returns {JSX.Element}
 */
export default function Routes( { theme_preference, theme_mode, on_theme_toggle } ) {

    // Shared props passed to pages that use AppLayout
    const layout_props = { theme_preference, theme_mode, on_theme_toggle }

    return <Suspense fallback={ <div /> }>
        <RouterRoutes>
            <Route path="/" element={ <WelcomePage /> } />
            <Route path="/select-model" element={ <ModelSelectPage /> } />
            <Route path="/download" element={ <DownloadPage /> } />
            <Route path="/chat" element={ <ChatPage { ...layout_props } /> } />
            <Route path="/chat/:id" element={ <ChatPage { ...layout_props } /> } />
            <Route path="*" element={ <NotFoundPage /> } />
        </RouterRoutes>
    </Suspense>

}
