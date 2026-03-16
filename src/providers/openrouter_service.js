/**
 * OpenRouter API client — thin wrapper around the OpenAI-compatible API.
 *
 * OpenRouter proxies hundreds of models via a single API key.
 * All endpoints support CORS (Access-Control-Allow-Origin: *),
 * so this works in both Electron and browser environments.
 *
 * @module openrouter_service
 */
import { log } from 'mentie'

const OPENROUTER_BASE = `https://openrouter.ai/api/v1`


// ─── Headers ─────────────────────────────────────────────────────────────────

/**
 * Build standard headers for OpenRouter API requests.
 * @param {string} api_key
 * @returns {Object}
 */
export const openrouter_headers = ( api_key ) => ( {
    'Authorization': `Bearer ${ api_key }`,
    'Content-Type': `application/json`,
    'HTTP-Referer': window.location?.origin || `https://gratisai.app`,
    'X-Title': `gratisAI`,
} )


// ─── Models ──────────────────────────────────────────────────────────────────

// In-memory cache — models list rarely changes mid-session
let _models_cache = null
let _models_cache_key = ``

/**
 * Fetch available models from OpenRouter.
 *
 * Results are cached in memory for the lifetime of the page — the model
 * list changes infrequently and this avoids redundant API calls during
 * setup wizard interactions.
 *
 * @param {string} api_key
 * @returns {Promise<Array<{ id: string, name: string, pricing: Object }>>}
 */
export async function fetch_models( api_key ) {

    if( _models_cache && _models_cache_key === api_key ) {
        return _models_cache
    }

    const res = await fetch( `${ OPENROUTER_BASE }/models`, {
        headers: openrouter_headers( api_key ),
    } )

    if( !res.ok ) {
        const body = await res.text().catch( () => `` )
        throw new Error( `OpenRouter API error (${ res.status }): ${ body || res.statusText }` )
    }

    const data = await res.json()
    _models_cache = data.data || []
    _models_cache_key = api_key

    log.info( `[openrouter] Fetched ${ _models_cache.length } models` )
    return _models_cache

}


// ─── Credits / key validation ────────────────────────────────────────────────

/**
 * Fetch API key info from OpenRouter.
 *
 * Returns key metadata including remaining credit limit and usage.
 * The `/auth/key` endpoint is under `/api/v1` (not a separate base).
 *
 * @param {string} api_key
 * @returns {Promise<Object>} Key info with `limit`, `limit_remaining`, `usage`, etc.
 */
export async function fetch_key_info( api_key ) {

    const res = await fetch( `${ OPENROUTER_BASE }/auth/key`, {
        headers: openrouter_headers( api_key ),
    } )

    if( !res.ok ) {
        const body = await res.text().catch( () => `` )
        throw new Error( `OpenRouter API error (${ res.status }): ${ body || res.statusText }` )
    }

    const data = await res.json()
    return data.data || data

}

/**
 * Validate an API key by attempting to fetch key info.
 * @param {string} api_key
 * @returns {Promise<boolean>}
 */
export async function validate_api_key( api_key ) {

    try {
        await fetch_key_info( api_key )
        return true
    } catch {
        return false
    }

}
