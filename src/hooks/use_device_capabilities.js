import { useState, useEffect } from 'react'
import { detect_capabilities, estimate_max_model_bytes } from '../utils/device_detection'

/**
 * Hook that detects device capabilities on mount
 * @returns {{ capabilities: import('../utils/device_detection').DeviceCapabilities | null, max_model_bytes: number, is_detecting: boolean }}
 */
export default function use_device_capabilities() {

    const [ capabilities, set_capabilities ] = useState( null )
    const [ max_model_bytes, set_max_model_bytes ] = useState( Infinity )
    const [ is_detecting, set_is_detecting ] = useState( true )

    useEffect( () => {

        let cancelled = false

        detect_capabilities().then( ( result ) => {
            if( !cancelled ) {
                set_capabilities( result )
                set_max_model_bytes( estimate_max_model_bytes( result ) )
                set_is_detecting( false )
            }
        } )

        return () => {
            cancelled = true
        }

    }, [] )

    return { capabilities, max_model_bytes, is_detecting }

}
