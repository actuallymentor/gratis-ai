/**
 * Parse a model query parameter into one of three formats:
 * 1. Local model ID (no slashes) — look up by cached model id
 * 2. HF repo (org/reponame) — look up or download from repo
 * 3. HF repo + file (org/reponame/file.gguf) — specific file from repo
 *
 * @param {string} model_param - The raw ?model= query parameter value
 * @returns {{ type: 'local' | 'repo' | 'repo_file', value: string, repo?: string, file?: string }}
 */
export const parse_model_param = ( model_param ) => {

    if( !model_param ) return null

    const parts = model_param.split( `/` )

    // Format 3: org/reponame/file.gguf
    if( parts.length >= 3 && model_param.endsWith( `.gguf` ) ) {
        const repo = `${ parts[ 0 ] }/${ parts[ 1 ] }`
        const file = parts.slice( 2 ).join( `/` )
        return { type: `repo_file`, value: model_param, repo, file }
    }

    // Format 2: org/reponame (exactly one slash, no .gguf ending)
    if( parts.length === 2 && !model_param.endsWith( `.gguf` ) ) {
        return { type: `repo`, value: model_param, repo: model_param }
    }

    // Format 1: local ID (no slashes)
    return { type: `local`, value: model_param }

}

/**
 * Attempt to resolve a model param to a cached model
 * @param {Object} parsed - Result from parse_model_param
 * @param {Array} cached_models - Array of cached model metadata
 * @returns {Object|null} Matching cached model, or null
 */
export const resolve_cached_model = ( parsed, cached_models ) => {

    if( !parsed || !cached_models?.length ) return null

    switch ( parsed.type ) {

    case `local`:
        // Match by ID directly
        return cached_models.find( ( m ) => m.id === parsed.value ) || null

    case `repo`:
        // Match by HF repo
        return cached_models.find( ( m ) => m.hugging_face_repo === parsed.repo ) || null

    case `repo_file`:
        // Match by HF repo + filename
        return cached_models.find( ( m ) =>
            m.hugging_face_repo === parsed.repo && m.file_name === parsed.file
        ) || null

    default:
        return null

    }

}
