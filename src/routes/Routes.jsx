import { lazy, Suspense } from 'react'
import { Routes as RouterRoutes, Route } from 'react-router-dom'
import { prefetch } from 'less-lazy'

// Lazy load all pages with prefetching for code splitting
const WelcomePage = lazy( prefetch( () => import( '../components/pages/WelcomePage' ) ) )
const ModelSelectPage = lazy( prefetch( () => import( '../components/pages/ModelSelectPage' ) ) )
const DownloadPage = lazy( prefetch( () => import( '../components/pages/DownloadPage' ) ) )
const ChatPage = lazy( prefetch( () => import( '../components/pages/ChatPage' ) ) )

/**
 * Application route definitions
 * @returns {JSX.Element} Route configuration
 */
export default function Routes() {

    return <Suspense fallback={ <div /> }>
        <RouterRoutes>
            <Route path="/" element={ <WelcomePage /> } />
            <Route path="/select-model" element={ <ModelSelectPage /> } />
            <Route path="/download" element={ <DownloadPage /> } />
            <Route path="/chat" element={ <ChatPage /> } />
            <Route path="/chat/:id" element={ <ChatPage /> } />
        </RouterRoutes>
    </Suspense>

}
