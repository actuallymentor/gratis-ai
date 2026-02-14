import { useState, useEffect } from 'react'
import { detect_capabilities } from '../utils/device_detection'

/**
 * Hook that detects device capabilities on mount
 * @returns {{ capabilities: import('../utils/device_detection').DeviceCapabilities | null, is_detecting: boolean }}
 */
export default function use_device_capabilities() {

    const [ capabilities, set_capabilities ] = useState( null )
    const [ is_detecting, set_is_detecting ] = useState( true )

    useEffect( () => {

        let cancelled = false

        detect_capabilities().then( ( result ) => {
            if( !cancelled ) {
                set_capabilities( result )
                set_is_detecting( false )
            }
        } )

        return () => {
            cancelled = true 
        }

    }, [] )

    return { capabilities, is_detecting }

}
