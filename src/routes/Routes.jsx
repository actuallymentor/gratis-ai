import { lazy, Suspense } from 'react'
import { Routes as RouterRoutes, Route } from 'react-router-dom'
import { prefetch } from 'less-lazy'
import { storage_key } from '../utils/branding'

// Lazy load all pages with prefetching for code splitting
const WelcomePage = lazy( prefetch( () => import( '../components/pages/WelcomePage' ) ) )
const HomePage = lazy( prefetch( () => import( '../components/pages/HomePage' ) ) )
const ModelSelectPage = lazy( prefetch( () => import( '../components/pages/ModelSelectPage' ) ) )
const DownloadPage = lazy( prefetch( () => import( '../components/pages/DownloadPage' ) ) )
const ChatPage = lazy( prefetch( () => import( '../components/pages/ChatPage' ) ) )
const GetAppPage = lazy( prefetch( () => import( '../components/pages/GetAppPage' ) ) )
const NotFoundPage = lazy( prefetch( () => import( '../components/pages/NotFoundPage' ) ) )

/**
 * Pick the right landing page: returning users get the search home,
 * first-time users get the onboarding welcome.
 */
function LandingPage() {
    const has_model = !!localStorage.getItem( storage_key( `active_model_id` ) )
    return has_model ? <HomePage /> : <WelcomePage />
}

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
            <Route path="/" element={ <LandingPage /> } />
            <Route path="/select-model" element={ <ModelSelectPage /> } />
            <Route path="/download" element={ <DownloadPage /> } />
            <Route path="/chat" element={ <ChatPage { ...layout_props } /> } />
            <Route path="/chat/:id" element={ <ChatPage { ...layout_props } /> } />
            <Route path="/get-app" element={ <GetAppPage /> } />
            <Route path="*" element={ <NotFoundPage /> } />
        </RouterRoutes>
    </Suspense>

}
