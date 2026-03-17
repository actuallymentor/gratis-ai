/**
 * Venice.ai API client — thin wrapper around the OpenAI-compatible API.
 *
 * Venice provides uncensored cloud inference with CORS support,
 * so this works in both Electron and browser environments.
 *
 * @module venice_service
 */
import { log } from 'mentie'

const VENICE_BASE = `https://api.venice.ai/api/v1`


// ─── Headers ─────────────────────────────────────────────────────────────────

/**
 * Build standard headers for Venice API requests.
 * @param {string} api_key
 * @returns {Object}
 */
export const venice_headers = ( api_key ) => ( {
    'Authorization': `Bearer ${ api_key }`,
    'Content-Type': `application/json`,
} )


// ─── Models ──────────────────────────────────────────────────────────────────

// In-memory cache — models list rarely changes mid-session
let _models_cache = null
let _models_cache_key = ``

/**
 * Fetch available models from Venice.
 *
 * Results are cached in memory for the lifetime of the page — the model
 * list changes infrequently and this avoids redundant API calls during
 * setup wizard interactions.
 *
 * @param {string} api_key
 * @returns {Promise<Array<{ id: string, name: string }>>}
 */
export async function fetch_models( api_key ) {

    if( _models_cache && _models_cache_key === api_key ) {
        return _models_cache
    }

    const res = await fetch( `${ VENICE_BASE }/models`, {
        headers: venice_headers( api_key ),
    } )

    if( !res.ok ) {
        const body = await res.text().catch( () => `` )
        throw new Error( `Venice API error (${ res.status }): ${ body || res.statusText }` )
    }

    const data = await res.json()
    _models_cache = data.data || []
    _models_cache_key = api_key

    log.info( `[venice] Fetched ${ _models_cache.length } models` )
    return _models_cache

}


// ─── Key validation ─────────────────────────────────────────────────────────

/**
 * Validate an API key by attempting to list models.
 * Venice has no `/auth/key` endpoint, so we call `GET /models` instead.
 * @param {string} api_key
 * @returns {Promise<boolean>}
 */
export async function validate_api_key( api_key ) {

    try {
        await fetch_models( api_key )
        return true
    } catch {
        return false
    }

}
