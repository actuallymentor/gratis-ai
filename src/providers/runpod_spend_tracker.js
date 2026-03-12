/**
 * Client-side daily spend accumulator — tracks RunPod GPU costs in localStorage.
 *
 * Resets automatically at midnight UTC. All amounts in USD.
 *
 * @module runpod_spend_tracker
 */
import { storage_key } from '../utils/branding'

const SPEND_KEY = storage_key( `runpod_daily_spend` )
const DATE_KEY = storage_key( `runpod_spend_date` )


/**
 * Get today's date string in UTC (YYYY-MM-DD).
 * @returns {string}
 */
function today_utc() {
    return new Date().toISOString().slice( 0, 10 )
}

/**
 * Reset spend if the stored date is not today.
 */
function maybe_reset() {

    const stored_date = localStorage.getItem( DATE_KEY )
    if( stored_date !== today_utc() ) {
        localStorage.setItem( DATE_KEY, today_utc() )
        localStorage.setItem( SPEND_KEY, `0` )
    }

}

/**
 * Record a GPU usage charge.
 *
 * @param {number} elapsed_seconds - Time the GPU was active
 * @param {number} price_per_hr - GPU cost in $/hr
 */
export function record_spend( elapsed_seconds, price_per_hr ) {

    maybe_reset()

    const cost =  elapsed_seconds / 3600  * price_per_hr
    const current = parseFloat( localStorage.getItem( SPEND_KEY ) || `0` )
    localStorage.setItem( SPEND_KEY, String( current + cost ) )

}

/**
 * Get today's accumulated spend.
 * @returns {number} USD
 */
export function get_daily_spend() {
    maybe_reset()
    return parseFloat( localStorage.getItem( SPEND_KEY ) || `0` )
}

/**
 * Check if the daily spend limit has been exceeded.
 * @param {number} max_daily_usd - Maximum daily spend in USD
 * @returns {boolean}
 */
export function is_over_limit( max_daily_usd ) {
    return get_daily_spend() >= max_daily_usd
}
