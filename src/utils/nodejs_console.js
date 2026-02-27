/**
 * Subscribe to forwarded Node.js console logs.
 *
 * Replays them in the browser DevTools with a [nodejs] prefix,
 * using mentie's `log` for level-appropriate display.
 *
 * Call once at app startup — returns a cleanup function.
 * No-ops gracefully in browser/PWA mode where electronAPI is absent.
 */

import { log } from 'mentie'

export const subscribe_to_nodejs_console = () => {

    const api = window.electronAPI
    if( !api?.on_nodejs_console ) return () => {}

    const unsubscribe = api.on_nodejs_console( ( { level, message } ) => {

        const tag = `[nodejs]`

        if( level === `warn` ) return log.warn( tag, message )
        if( level === `error` ) return log.error( tag, message )

        log( tag, message )

    } )

    return unsubscribe

}
