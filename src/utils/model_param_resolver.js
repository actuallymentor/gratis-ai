import { log } from 'mentie'

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
        log.debug( `[model_param] Parsed as repo_file: ${ model_param }` )
        return { type: `repo_file`, value: model_param, repo, file }
    }

    // Format 2: org/reponame (exactly one slash, no .gguf ending)
    if( parts.length === 2 && !model_param.endsWith( `.gguf` ) ) {
        log.debug( `[model_param] Parsed as repo: ${ model_param }` )
        return { type: `repo`, value: model_param, repo: model_param }
    }

    // Format 1: local ID (no slashes)
    log.debug( `[model_param] Parsed as local: ${ model_param }` )
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

    case `local`: {
        // Match by ID directly
        const match = cached_models.find( ( m ) => m.id === parsed.value ) || null
        log.debug( match ? `[model_param] Resolved -> ${ match.id }` : `[model_param] No cache match for ${ parsed.value }` )
        return match
    }

    case `repo`: {
        // Match by HF repo
        const match = cached_models.find( ( m ) => m.hugging_face_repo === parsed.repo ) || null
        log.debug( match ? `[model_param] Resolved -> ${ match.id }` : `[model_param] No cache match for ${ parsed.value }` )
        return match
    }

    case `repo_file`: {
        // Match by HF repo + filename
        const match = cached_models.find( ( m ) =>
            m.hugging_face_repo === parsed.repo && m.file_name === parsed.file
        ) || null
        log.debug( match ? `[model_param] Resolved -> ${ match.id }` : `[model_param] No cache match for ${ parsed.value }` )
        return match
    }

    default:
        return null

    }

}
