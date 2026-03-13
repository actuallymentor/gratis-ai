import { useState, useEffect } from 'react'


/**
 * Reactive wrapper around `navigator.onLine`.
 * Re-renders when the browser goes online or offline.
 */
export default function use_online() {

    const [ is_online, set_is_online ] = useState( navigator.onLine )

    useEffect( () => {

        const go_online = () => set_is_online( true )
        const go_offline = () => set_is_online( false )

        window.addEventListener( 'online', go_online )
        window.addEventListener( 'offline', go_offline )

        return () => {
            window.removeEventListener( 'online', go_online )
            window.removeEventListener( 'offline', go_offline )
        }

    }, [] )

    return is_online

}
