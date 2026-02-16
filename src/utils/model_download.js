import { get_db } from '../stores/db'

const HF_BASE_URL = import.meta.env.VITE_HF_BASE_URL || `https://huggingface.co`

/**
 * Builds the Hugging Face download URL for a model
 * @param {string} repo - Hugging Face repo (e.g., "TheBloke/model-GGUF")
 * @param {string} file_name - GGUF file name
 * @returns {string} Full download URL
 */
export const build_download_url = ( repo, file_name ) =>
    `${ HF_BASE_URL }/${ repo }/resolve/main/${ file_name }`

/**
 * Checks if a model is already cached in IndexedDB.
 * When expected_repo and expected_file are provided, also verifies the cached
 * model came from the same source — this handles registry changes (e.g. switching
 * from a broken GGUF publisher to a working one).
 * @param {string} model_id - Model identifier
 * @param {string} [expected_repo] - Expected hugging_face_repo value
 * @param {string} [expected_file] - Expected file_name value
 * @returns {Promise<boolean>}
 */
export const is_model_cached = async ( model_id, expected_repo, expected_file ) => {

    const db = await get_db()
    const cached = await db.get( `models`, model_id )
    if( !cached ) return false

    // If caller provided expected source, verify the cache matches
    // A mismatch means the registry changed to a different GGUF file
    if( expected_repo && cached.hugging_face_repo !== expected_repo ) {
        await db.delete( `models`, model_id )
        return false
    }
    if( expected_file && cached.file_name !== expected_file ) {
        await db.delete( `models`, model_id )
        return false
    }

    return true

}

/**
 * Gets cached model metadata (without blob for performance)
 * @param {string} model_id
 * @returns {Promise<Object|null>}
 */
export const get_cached_model = async ( model_id ) => {

    const db = await get_db()
    return db.get( `models`, model_id )

}

/**
 * Downloads a GGUF model from Hugging Face with progress tracking
 * Stores the model blob and metadata in IndexedDB
 *
 * @param {Object} model - Model definition
 * @param {string} model.id - Unique model ID
 * @param {string} model.hugging_face_repo - HF repo path
 * @param {string} model.file_name - GGUF filename
 * @param {string} model.name - Human-readable name
 * @param {string} model.category - Model tier
 * @param {number} model.file_size_bytes - Expected file size
 * @param {string} model.parameters_label - Parameter count label
 * @param {string} model.quantization - Quantization label
 * @param {number} model.context_length - Context window
 * @param {Function} on_progress - Progress callback ({ progress, bytes_loaded, bytes_total, status })
 * @param {AbortSignal} [signal] - Abort signal for cancellation
 * @returns {Promise<void>}
 */
export const download_model = async ( model, on_progress, signal ) => {

    const url = build_download_url( model.hugging_face_repo, model.file_name )

    on_progress( { progress: 0, bytes_loaded: 0, bytes_total: model.file_size_bytes, status: `Starting download...` } )

    const response = await fetch( url, { signal } )

    if( !response.ok ) {
        throw new Error( `Download failed: ${ response.status } ${ response.statusText }` )
    }

    const content_length = parseInt( response.headers.get( `content-length` ) ) || model.file_size_bytes
    const reader = response.body.getReader()
    const chunks = []
    let bytes_loaded = 0

    // Stream the response and track progress
    while( true ) {

        const { done, value } = await reader.read()
        if( done ) break

        chunks.push( value )
        bytes_loaded += value.length

        const progress = content_length > 0 ? bytes_loaded / content_length : 0

        on_progress( {
            progress: Math.min( progress, 1 ),
            bytes_loaded,
            bytes_total: content_length,
            status: `Downloading...`,
        } )

    }

    on_progress( { progress: 1, bytes_loaded, bytes_total: content_length, status: `Saving to cache...` } )

    // Combine chunks into a single blob
    const blob = new Blob( chunks )
    const now = Date.now()

    // Store in IndexedDB
    const db = await get_db()
    await db.put( `models`, {
        id: model.id,
        blob,
        cached_at: now,
        file_size_bytes: blob.size,
        name: model.name,
        category: model.category,
        hugging_face_repo: model.hugging_face_repo,
        file_name: model.file_name,
        parameters_label: model.parameters_label,
        quantization: model.quantization,
        context_length: model.context_length,
        last_used_at: now,
    } )

    on_progress( { progress: 1, bytes_loaded: blob.size, bytes_total: blob.size, status: `Complete` } )

}
