import { useState, useEffect, useCallback } from 'react'

/**
 * Manages the auto-update lifecycle for the Electron app.
 * No-ops gracefully in browser/PWA mode where electronAPI.updater is absent.
 *
 * @returns {{ available_update: object|null, is_downloading: boolean, download_progress: number, is_ready_to_install: boolean, dismissed: boolean, download_update: Function, install_update: Function, dismiss: Function }}
 */
export default function use_auto_updater() {

    const [ available_update, set_available_update ] = useState( null )
    const [ is_downloading, set_is_downloading ] = useState( false )
    const [ download_progress, set_download_progress ] = useState( 0 )
    const [ is_ready_to_install, set_is_ready_to_install ] = useState( false )
    const [ dismissed, set_dismissed ] = useState( false )

    // Subscribe to updater events from the main process
    useEffect( () => {

        const updater = window.electronAPI?.updater
        if( !updater ) return

        const off_available = updater.on_update_available( ( data ) => {
            set_available_update( data )
            set_dismissed( false )
        } )

        const off_progress = updater.on_download_progress( ( data ) => {
            set_download_progress( data.percent )
        } )

        const off_downloaded = updater.on_update_downloaded( ( data ) => {
            set_is_downloading( false )
            set_is_ready_to_install( true )
            set_available_update( ( prev ) => prev || data )
            set_dismissed( false )
        } )

        const off_error = updater.on_update_error( () => {
            set_is_downloading( false )
        } )

        return () => {
            off_available?.()
            off_progress?.()
            off_downloaded?.()
            off_error?.()
        }

    }, [] )

    const download_update = useCallback( () => {

        const updater = window.electronAPI?.updater
        if( !updater ) return

        set_is_downloading( true )
        set_download_progress( 0 )
        updater.download_update()

    }, [] )

    const install_update = useCallback( () => {

        const updater = window.electronAPI?.updater
        if( !updater ) return

        updater.install_update()

    }, [] )

    const dismiss = useCallback( () => set_dismissed( true ), [] )

    return {
        available_update,
        is_downloading,
        download_progress,
        is_ready_to_install,
        dismissed,
        download_update,
        install_update,
        dismiss,
    }

}
