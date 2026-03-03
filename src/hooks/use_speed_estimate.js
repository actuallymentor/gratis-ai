import { useState, useCallback, useRef, useEffect } from 'react'


// ─── Speed-test file ladder ─────────────────────────────────────────────────────
// Each step is tried in order. If the download finishes in < 800ms the result
// is too noisy, so we escalate to the next file for a more reliable reading.

const TEST_FILES = [
    { path: `/speedtest/1mib.bin`,  bytes: 1 * 1024 * 1024 },
    { path: `/speedtest/10mib.bin`, bytes: 10 * 1024 * 1024 },
    { path: `/speedtest/25mib.bin`, bytes: 25 * 1024 * 1024 },
]

const MIN_RELIABLE_MS = 800


/**
 * @typedef {Object} SpeedEstimate
 * @property {number|null}  speed_bps      - Measured speed in bytes per second
 * @property {number|null}  speed_mbps     - Measured speed in megabits per second
 * @property {boolean}      is_estimating  - True while a measurement is in progress
 * @property {Error|null}   error          - Last error, if any
 * @property {() => void}   run_estimate   - Trigger a new measurement
 */


/**
 * Adaptive download-speed estimation hook.
 *
 * Downloads progressively larger test files until the transfer takes long enough
 * (≥ 800ms) to produce a reliable speed reading. Consumer triggers measurement
 * manually via `run_estimate()` to avoid surprise bandwidth usage.
 *
 * @returns {SpeedEstimate}
 */
export default function use_speed_estimate() {

    const [ speed_bps, set_speed_bps ]       = useState( null )
    const [ speed_mbps, set_speed_mbps ]     = useState( null )
    const [ is_estimating, set_estimating ]  = useState( false )
    const [ error, set_error ]               = useState( null )

    // AbortController ref — lets us cancel in-flight fetches on unmount or re-run
    const abort_ref = useRef( null )

    // In Electron the origin is file:// — speedtest binaries live on the hosted app
    const base_url = import.meta.env.VITE_APP_BASE_URL
        || ( window.electronAPI?.native_inference && import.meta.env.VITE_APP_URL )
        || window.location.origin


    const run_estimate = useCallback( async () => {

        // Cancel any previous in-flight measurement
        abort_ref.current?.abort()
        const controller = new AbortController()
        abort_ref.current = controller

        set_estimating( true )
        set_error( null )

        try {

            let measured_bps = null

            for( const { path, bytes } of TEST_FILES ) {

                // Cache-bust so we always measure real network speed
                const url = `${ base_url }${ path }?_cb=${ Date.now() }`

                const t0 = performance.now()

                const response = await fetch( url, {
                    cache: 'no-store',
                    mode: base_url === window.location.origin ? 'same-origin' : 'cors',
                    signal: controller.signal,
                } )

                if( !response.ok ) throw new Error( `Speed test failed: ${ response.status }` )

                // Consume the full body before stopping the timer
                await response.arrayBuffer()

                const elapsed_ms = performance.now() - t0
                measured_bps = bytes / ( elapsed_ms / 1000 )

                // If the download took long enough, this reading is reliable
                if( elapsed_ms >= MIN_RELIABLE_MS ) break

            }

            // Use whatever we got — last file is always accepted
            if( measured_bps !== null ) {
                set_speed_bps( measured_bps )
                set_speed_mbps(  measured_bps * 8  / 1_000_000 )
            }

        } catch ( err ) {

            // Don't surface abort errors — they're intentional cancellations
            if( err.name !== 'AbortError' ) {
                set_error( err )
            }

        } finally {
            set_estimating( false )
        }

    }, [ base_url ] )


    // Abort any in-flight fetch when the consuming component unmounts
    useEffect( () => () => abort_ref.current?.abort(), [] )


    return { speed_bps, speed_mbps, is_estimating, error, run_estimate }

}
