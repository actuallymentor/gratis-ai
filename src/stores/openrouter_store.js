/**
 * OpenRouter config store — persisted to localStorage via Zustand.
 *
 * Stores the API key, connected cloud models, and user preferences
 * for the OpenRouter cloud inference feature (Nerd Mode).
 *
 * @module openrouter_store
 */
import { create } from 'zustand'
import { log } from 'mentie'
import { storage_key } from '../utils/branding'

const STORE_KEY = storage_key( `openrouter_config` )

/**
 * @typedef {Object} OpenRouterModel
 * @property {string} id - Internal ID (for UI keys)
 * @property {string} openrouter_id - OpenRouter model ID (e.g. `qwen/qwen3-30b-a3b`)
 * @property {string} name - Display name
 * @property {number} created_at - Timestamp
 */


/**
 * Read persisted state from localStorage.
 * @returns {Object}
 */
function load_from_storage() {

    try {
        const raw = localStorage.getItem( STORE_KEY )
        if( raw ) return JSON.parse( raw )
    } catch ( err ) {
        log.warn( `[openrouter_store] Failed to parse stored config: ${ err.message }` )
    }

    return {}

}

/**
 * Persist state subset to localStorage.
 * @param {Object} state
 */
function save_to_storage( state ) {

    const persisted = {
        api_key: state.api_key,
        models: state.models,
        daily_credit_limit: state.daily_credit_limit,
        system_prompt: state.system_prompt,
    }

    localStorage.setItem( STORE_KEY, JSON.stringify( persisted ) )

}


const stored = load_from_storage()

const use_openrouter_store = create( ( set, get ) => ( {

    // ── State ────────────────────────────────────────────────────────────

    api_key: stored.api_key || ``,
    models: stored.models || [],
    daily_credit_limit: stored.daily_credit_limit ?? 5,
    system_prompt: stored.system_prompt || ``,

    // ── Actions ──────────────────────────────────────────────────────────

    set_api_key: ( api_key ) => {
        set( { api_key } )
        save_to_storage( get() )
    },

    set_daily_credit_limit: ( daily_credit_limit ) => {
        set( { daily_credit_limit } )
        save_to_storage( get() )
    },

    set_system_prompt: ( system_prompt ) => {
        set( { system_prompt } )
        save_to_storage( get() )
    },

    /**
     * Check if a model is already tracked by its OpenRouter ID.
     * @param {string} openrouter_id
     * @returns {boolean}
     */
    has_model: ( openrouter_id ) => get().models.some( m => m.openrouter_id === openrouter_id ),

    /**
     * Add a model to the store.
     * @param {OpenRouterModel} model
     */
    add_model: ( model ) => {
        set( state => ( { models: [ ...state.models, model ] } ) )
        save_to_storage( get() )
        log.info( `[openrouter_store] Added model ${ model.openrouter_id }` )
    },

    /**
     * Remove a model from the store by its OpenRouter ID.
     * @param {string} openrouter_id
     */
    remove_model: ( openrouter_id ) => {
        set( state => ( {
            models: state.models.filter( m => m.openrouter_id !== openrouter_id ),
        } ) )
        save_to_storage( get() )
        log.info( `[openrouter_store] Removed model ${ openrouter_id }` )
    },

    /**
     * Reload state from localStorage (useful after cross-tab changes).
     */
    reload: () => {
        const fresh = load_from_storage()
        set( {
            api_key: fresh.api_key || ``,
            models: fresh.models || [],
            daily_credit_limit: fresh.daily_credit_limit ?? 5,
            system_prompt: fresh.system_prompt || ``,
        } )
    },

} ) )

export default use_openrouter_store
