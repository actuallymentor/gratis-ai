import { useState, useEffect, useCallback } from 'react'
import { get_db } from '../stores/db'

/**
 * Hook for managing cached models in IndexedDB
 * Provides model listing, storage info, and delete operations
 * @returns {Object} Model management state and operations
 */
export default function use_model_manager() {

    const [ cached_models, set_cached_models ] = useState( [] )
    const [ storage_used, set_storage_used ] = useState( 0 )
    const [ storage_estimate, set_storage_estimate ] = useState( null )
    const [ is_loading, set_is_loading ] = useState( false )

    /**
     * Load all cached models from IndexedDB, sorted by last_used_at (most recent first)
     */
    const refresh_models = useCallback( async () => {

        try {

            const db = await get_db()
            const all = await db.getAllFromIndex( `models`, `last_used_at` )
            // Reverse to get most recent first
            const sorted = all.reverse()

            // Calculate total storage (excluding blob from display data)
            const total_bytes = sorted.reduce( ( sum, m ) => sum + ( m.file_size_bytes || 0 ), 0 )
            set_storage_used( total_bytes )
            set_cached_models( sorted.map( ( { blob, ...rest } ) => rest ) )

            // Estimate available storage
            if( navigator.storage?.estimate ) {
                const estimate = await navigator.storage.estimate()
                set_storage_estimate( estimate.quota - estimate.usage )
            }

        } catch ( err ) {
            console.error( `Failed to load cached models:`, err )
        }

    }, [] )

    // Load on mount
    useEffect( () => {
        refresh_models()
    }, [ refresh_models ] )

    /**
     * Delete a cached model from IndexedDB
     * @param {string} model_id - The model ID to delete
     * @returns {Promise<void>}
     */
    const delete_model = useCallback( async ( model_id ) => {

        const active_id = localStorage.getItem( `locallm:settings:active_model_id` )
        if( model_id === active_id ) {
            throw new Error( `Cannot delete the currently active model. Switch to another model first.` )
        }

        set_is_loading( true )
        try {

            const db = await get_db()
            await db.delete( `models`, model_id )
            await refresh_models()

        } finally {
            set_is_loading( false )
        }

    }, [ refresh_models ] )

    return {
        cached_models,
        storage_used,
        storage_estimate,
        is_loading,
        delete_model,
        refresh_models,
    }

}
