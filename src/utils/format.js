/**
 * Format generation stats into a display string
 * @param {import('../providers/types').GenerationStats} stats
 * @returns {string} e.g., "42 tokens · 8.3 tok/s · 5.1s"
 */
export const format_stats = ( stats ) => {
    if( !stats ) return ``
    const tokens = stats.tokens_generated
    const tps = stats.tokens_per_second.toFixed( 1 )
    const time = ( stats.elapsed_ms / 1000 ).toFixed( 1 )
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
 * Format a timestamp into a relative or short date string
 * @param {number} timestamp
 * @returns {string}
 */
export const format_time = ( timestamp ) => {

    const now = Date.now()
    const diff = now - timestamp

    if( diff < 60_000 ) return `Just now`
    if( diff < 3_600_000 ) return `${ Math.floor( diff / 60_000 ) }m ago`
    if( diff < 86_400_000 ) return `${ Math.floor( diff / 3_600_000 ) }h ago`

    return new Date( timestamp ).toLocaleDateString()

}
