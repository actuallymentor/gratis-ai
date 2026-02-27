/**
 * Format generation stats into a display string.
 * Accepts an optional `t` function for i18n; falls back to a plain English template.
 * @param {import('../providers/types').GenerationStats} stats
 * @param {Function} [t] - i18next translation function
 * @returns {string} e.g., "42 tokens · 8.3 tok/s · 5.1s"
 */
export const format_stats = ( stats, t ) => {

    if( !stats ) return ``

    const tokens = stats.tokens_generated
    const tps = stats.tokens_per_second.toFixed( 1 )
    const time = ( stats.elapsed_ms / 1000 ).toFixed( 1 )

    if( t ) return t( `common:format_tokens`, { tokens, tps, time } )
    return `${ tokens } tokens · ${ tps } tok/s · ${ time }s`

}

/**
 * Truncate text to max length with ellipsis
 * @param {string} text
 * @param {number} max_length
 * @returns {string}
 */
export const truncate = ( text, max_length = 50 ) => {
    if( !text || text.length <= max_length ) return text || ``
    return `${ text.slice( 0, max_length ) }...`
}

/**
 * Format a timestamp into a relative or short date string.
 * Accepts an optional `t` function for i18n; falls back to plain English.
 * @param {number} timestamp
 * @param {Function} [t] - i18next translation function
 * @returns {string}
 */
export const format_time = ( timestamp, t ) => {

    const now = Date.now()
    const diff = now - timestamp

    if( t ) {
        if( diff < 60_000 ) return t( `common:format_just_now` )
        if( diff < 3_600_000 ) return t( `common:format_minutes_ago`, { count: Math.floor( diff / 60_000 ) } )
        if( diff < 86_400_000 ) return t( `common:format_hours_ago`, { count: Math.floor( diff / 3_600_000 ) } )
    } else {
        if( diff < 60_000 ) return `Just now`
        if( diff < 3_600_000 ) return `${ Math.floor( diff / 60_000 ) }m ago`
        if( diff < 86_400_000 ) return `${ Math.floor( diff / 3_600_000 ) }h ago`
    }

    return new Date( timestamp ).toLocaleDateString()

}
