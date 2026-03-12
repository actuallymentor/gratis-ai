/**
 * RunPod config store — persisted to localStorage via Zustand.
 *
 * Stores the API key, deployed endpoints, and user preferences
 * for the cloud GPU inference feature (Nerd Mode).
 *
 * @module runpod_store
 */
import { create } from 'zustand'
import { log } from 'mentie'
import { storage_key } from '../utils/branding'

const STORE_KEY = storage_key( `runpod_config` )

/**
 * @typedef {Object} RunPodEndpoint
 * @property {string} id - Internal ID (for UI keys)
 * @property {string} endpoint_id - RunPod endpoint ID
 * @property {string} template_id - RunPod template ID
 * @property {string} model_name - HuggingFace model name
 * @property {string} gpu_id - GPU pool ID
 * @property {string} gpu_name - Human-readable GPU name
 * @property {number} price_per_hr - $/hr for cost tracking
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
        log.warn( `[runpod_store] Failed to parse stored config: ${ err.message }` )
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
        endpoints: state.endpoints,
        daily_spend_limit: state.daily_spend_limit,
        idle_timeout: state.idle_timeout,
        system_prompt: state.system_prompt,
    }

    localStorage.setItem( STORE_KEY, JSON.stringify( persisted ) )

}


const stored = load_from_storage()

const use_runpod_store = create( ( set, get ) => ( {

    // ── State ────────────────────────────────────────────────────────────

    api_key: stored.api_key || ``,
    endpoints: stored.endpoints || [],
    daily_spend_limit: stored.daily_spend_limit ?? 2,
    idle_timeout: stored.idle_timeout ?? 5,
    system_prompt: stored.system_prompt || ``,

    // ── Actions ──────────────────────────────────────────────────────────

    set_api_key: ( api_key ) => {
        set( { api_key } )
        save_to_storage( get() )
    },

    set_daily_spend_limit: ( daily_spend_limit ) => {
        set( { daily_spend_limit } )
        save_to_storage( get() )
    },

    set_idle_timeout: ( idle_timeout ) => {
        set( { idle_timeout } )
        save_to_storage( get() )
    },

    set_system_prompt: ( system_prompt ) => {
        set( { system_prompt } )
        save_to_storage( get() )
    },

    /**
     * Add a newly created endpoint to the store.
     * @param {RunPodEndpoint} endpoint
     */
    add_endpoint: ( endpoint ) => {
        set( state => ( { endpoints: [ ...state.endpoints, endpoint ] } ) )
        save_to_storage( get() )
        log.info( `[runpod_store] Added endpoint ${ endpoint.endpoint_id }` )
    },

    /**
     * Remove an endpoint from the store by its RunPod endpoint ID.
     * @param {string} endpoint_id
     */
    remove_endpoint: ( endpoint_id ) => {
        set( state => ( {
            endpoints: state.endpoints.filter( e => e.endpoint_id !== endpoint_id ),
        } ) )
        save_to_storage( get() )
        log.info( `[runpod_store] Removed endpoint ${ endpoint_id }` )
    },

    /**
     * Reload state from localStorage (useful after cross-tab changes).
     */
    reload: () => {
        const fresh = load_from_storage()
        set( {
            api_key: fresh.api_key || ``,
            endpoints: fresh.endpoints || [],
            daily_spend_limit: fresh.daily_spend_limit ?? 2,
            idle_timeout: fresh.idle_timeout ?? 5,
            system_prompt: fresh.system_prompt || ``,
        } )
    },

} ) )

export default use_runpod_store
