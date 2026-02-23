/**
 * Model Catalog — single source of truth for all preset models.
 *
 * ## For LLM maintainers
 *
 * This file is the canonical registry of GGUF models shipped with gratisAI.
 * It replaces the old `src/providers/model_registry.js` tier-based system with
 * real architecture parameters and proper memory estimation.
 *
 * ### How to add or update a model
 *
 * 1. Find the model's `config.json` on HuggingFace (e.g. `Qwen/Qwen3-8B`)
 * 2. Copy an existing entry and fill in: `parameters`, `layers`, `kv_heads`, `head_dim`
 * 3. Find the GGUF repo (common publishers: unsloth, bartowski, Qwen, ggml-org)
 * 4. Use the exact `file_size_bytes` from the GGUF file listing
 * 5. Set `featured: true` if this model should appear in the UI selection list
 *    (keep one featured model per memory tier — see the table below)
 * 6. Run `npm run build` to verify no issues
 *
 * ### When to update
 *
 * - Every 2-3 months, or when a major model release lands
 * - See `.notes/MODEL_SELECTION.md` §8 for the full chore procedure
 *
 * ### Featured model guidelines
 *
 * One `featured: true` model per memory tier, chosen by best benchmark performance:
 *
 * | Target Memory | Model            | Why                           |
 * |---------------|------------------|-------------------------------|
 * | ≤ 2 GiB       | Qwen3-0.6B       | Best sub-1B model             |
 * | ≤ 3 GiB       | Qwen3-1.7B       | Gap filler between 0.6B & 3B  |
 * | ≤ 3.4 GiB     | SmolLM3-3B       | Browser WASM sweet spot       |
 * | ≤ 5 GiB       | Qwen3-4B         | Matches 7B in smaller package |
 * | ≤ 8 GiB       | Qwen3-8B         | Best-in-class 8B              |
 * | ≤ 16 GiB      | Qwen3-14B        | Rivals 32B models             |
 * | ≤ 24 GiB      | Qwen3-32B        | Outperforms 72B models        |
 * | ≤ 48 GiB      | Llama-3.3-70B    | Strong general-purpose        |
 *
 * @module model_catalog
 */


// ─── Model definition type ─────────────────────────────────────────────────────

/**
 * @typedef {Object} ModelDefinition
 * @property {string} id - Unique identifier (kebab-case)
 * @property {string} name - Human-readable display name
 * @property {string} description - Short description for the UI
 * @property {string} family - Model family (e.g. 'qwen3', 'smollm3', 'llama3')
 * @property {number} parameters - Raw parameter count (e.g. 600_000_000)
 * @property {string} parameters_label - Display label (e.g. '0.6B')
 * @property {string} quantization - GGUF quantization type (e.g. 'Q4_K_M')
 * @property {number} bpw - Bits per weight for this quantization
 * @property {number} file_size_bytes - Exact GGUF file size
 * @property {number} context_length - Max context window
 * @property {number} layers - Number of transformer layers
 * @property {number} kv_heads - Number of key-value attention heads (GQA)
 * @property {number} head_dim - Dimension per attention head
 * @property {string} hugging_face_repo - HF repo path (org/name)
 * @property {string} file_name - GGUF filename
 * @property {boolean} featured - Whether to show in the model selection UI
 * @property {string} license - License identifier
 * @property {string} [category] - Legacy tier label for backward compat with cached IndexedDB data
 */


// ─── The catalog ────────────────────────────────────────────────────────────────

/**
 * Complete model catalog — all preset models available in gratisAI.
 * Featured models appear in the selection UI. Non-featured models are
 * still auto-selectable by the recommendation engine.
 * @type {ModelDefinition[]}
 */
export const MODEL_CATALOG = [

    // ── Featured: ≤ 2 GiB tier ──────────────────────────────────────────────

    {
        id: `qwen3-0.6b-q4km`,
        name: `Qwen3 0.6B`,
        description: `Tiny but remarkably capable. Great for mobile and low-resource devices.`,
        family: `qwen3`,
        parameters: 600_000_000,
        parameters_label: `0.6B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 396_705_472,
        context_length: 32_768,
        layers: 28,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-0.6B-GGUF`,
        file_name: `Qwen3-0.6B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    // ── Featured: ≤ 3 GiB tier ──────────────────────────────────────────────

    {
        id: `qwen3-1.7b-q4km`,
        name: `Qwen3 1.7B`,
        description: `Sweet spot between speed and smarts. Ideal for quick tasks.`,
        family: `qwen3`,
        parameters: 1_700_000_000,
        parameters_label: `1.7B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 1_107_409_472,
        context_length: 40_960,
        layers: 28,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-1.7B-GGUF`,
        file_name: `Qwen3-1.7B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    // ── Featured: ≤ 3.4 GiB tier (WASM browser sweet spot) ──────────────────

    {
        id: `smollm3-3b-q4km`,
        name: `SmolLM3 3B`,
        description: `Best model for browsers. Outperforms larger models in its class.`,
        family: `smollm3`,
        parameters: 3_000_000_000,
        parameters_label: `3B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 1_915_305_792,
        context_length: 8_192,
        layers: 36,
        kv_heads: 4,
        head_dim: 128,
        hugging_face_repo: `bartowski/HuggingFaceTB_SmolLM3-3B-GGUF`,
        file_name: `HuggingFaceTB_SmolLM3-3B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `medium`,
    },

    // ── Featured: ≤ 5 GiB tier ──────────────────────────────────────────────

    {
        id: `qwen3-4b-q4km`,
        name: `Qwen3 4B`,
        description: `Matches 7B model performance in a smaller package.`,
        family: `qwen3`,
        parameters: 4_000_000_000,
        parameters_label: `4B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 2_497_280_256,
        context_length: 32_768,
        layers: 36,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `Qwen/Qwen3-4B-GGUF`,
        file_name: `Qwen3-4B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `medium`,
    },

    // ── Featured: ≤ 8 GiB tier ──────────────────────────────────────────────

    {
        id: `qwen3-8b-q4km`,
        name: `Qwen3 8B`,
        description: `Best-in-class at 8B. Strong reasoning and multilingual support.`,
        family: `qwen3`,
        parameters: 8_000_000_000,
        parameters_label: `8B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 5_027_783_488,
        context_length: 32_768,
        layers: 36,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `Qwen/Qwen3-8B-GGUF`,
        file_name: `Qwen3-8B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `heavy`,
    },

    // ── Featured: ≤ 16 GiB tier ─────────────────────────────────────────────

    {
        id: `qwen3-14b-q4km`,
        name: `Qwen3 14B`,
        description: `Rivals 32B models. Excellent for reasoning and creative tasks.`,
        family: `qwen3`,
        parameters: 14_800_000_000,
        parameters_label: `14B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 9_001_753_984,
        context_length: 32_768,
        layers: 40,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-14B-GGUF`,
        file_name: `Qwen3-14B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `heavy`,
    },

    // ── Featured: ≤ 24 GiB tier ─────────────────────────────────────────────

    {
        id: `qwen3-32b-q4km`,
        name: `Qwen3 32B`,
        description: `Outperforms 72B models. Top-tier for capable hardware.`,
        family: `qwen3`,
        parameters: 32_000_000_000,
        parameters_label: `32B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 19_762_150_048,
        context_length: 32_768,
        layers: 64,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-32B-GGUF`,
        file_name: `Qwen3-32B-Q4_K_M.gguf`,
        featured: true,
        license: `Apache-2.0`,
        category: `ultra`,
    },

    // ── Featured: ≤ 48 GiB tier ─────────────────────────────────────────────

    {
        id: `llama-3.3-70b-q4km`,
        name: `Llama 3.3 70B`,
        description: `Strong general-purpose model for high-end hardware.`,
        family: `llama3`,
        parameters: 70_000_000_000,
        parameters_label: `70B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 42_520_398_432,
        context_length: 131_072,
        layers: 80,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Llama-3.3-70B-Instruct-GGUF`,
        file_name: `Llama-3.3-70B-Instruct-Q4_K_M.gguf`,
        featured: true,
        license: `Llama`,
        category: `ultra`,
    },


    // ── Non-featured alternatives (auto-selectable, hidden in UI) ───────────

    {
        id: `qwen3-0.6b-q8`,
        name: `Qwen3 0.6B`,
        description: `Higher quality quantization of the tiny Qwen3.`,
        family: `qwen3`,
        parameters: 600_000_000,
        parameters_label: `0.6B`,
        quantization: `Q8_0`,
        bpw: 8.50,
        file_size_bytes: 639_447_744,
        context_length: 32_768,
        layers: 28,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-0.6B-GGUF`,
        file_name: `Qwen3-0.6B-Q8_0.gguf`,
        featured: false,
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    {
        id: `phi-4-mini-q4km`,
        name: `Phi-4 Mini`,
        description: `Microsoft's reasoning-focused model. Strong at math and coding.`,
        family: `phi4`,
        parameters: 3_800_000_000,
        parameters_label: `3.8B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 2_491_874_272,
        context_length: 131_072,
        layers: 32,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Phi-4-mini-instruct-GGUF`,
        file_name: `Phi-4-mini-instruct-Q4_K_M.gguf`,
        featured: false,
        license: `MIT`,
        category: `medium`,
    },

    {
        id: `smollm3-3b-q8`,
        name: `SmolLM3 3B`,
        description: `Higher quality quantization of SmolLM3 for native runtimes.`,
        family: `smollm3`,
        parameters: 3_000_000_000,
        parameters_label: `3B`,
        quantization: `Q8_0`,
        bpw: 8.50,
        file_size_bytes: 3_275_575_104,
        context_length: 8_192,
        layers: 36,
        kv_heads: 4,
        head_dim: 128,
        hugging_face_repo: `bartowski/HuggingFaceTB_SmolLM3-3B-GGUF`,
        file_name: `HuggingFaceTB_SmolLM3-3B-Q8_0.gguf`,
        featured: false,
        license: `Apache-2.0`,
        category: `medium`,
    },

    {
        id: `qwen3-8b-q5km`,
        name: `Qwen3 8B`,
        description: `Higher quality quantization for users with a bit more headroom.`,
        family: `qwen3`,
        parameters: 8_000_000_000,
        parameters_label: `8B`,
        quantization: `Q5_K_M`,
        bpw: 5.70,
        file_size_bytes: 5_851_112_224,
        context_length: 32_768,
        layers: 36,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `Qwen/Qwen3-8B-GGUF`,
        file_name: `Qwen3-8B-Q5_K_M.gguf`,
        featured: false,
        license: `Apache-2.0`,
        category: `heavy`,
    },

    {
        id: `qwen3-14b-q5km`,
        name: `Qwen3 14B`,
        description: `Higher quality quantization of the excellent 14B model.`,
        family: `qwen3`,
        parameters: 14_800_000_000,
        parameters_label: `14B`,
        quantization: `Q5_K_M`,
        bpw: 5.70,
        file_size_bytes: 10_514_570_624,
        context_length: 32_768,
        layers: 40,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-14B-GGUF`,
        file_name: `Qwen3-14B-Q5_K_M.gguf`,
        featured: false,
        license: `Apache-2.0`,
        category: `heavy`,
    },

    {
        id: `qwen3-32b-q5km`,
        name: `Qwen3 32B`,
        description: `Higher quality quantization for maximum 32B performance.`,
        family: `qwen3`,
        parameters: 32_000_000_000,
        parameters_label: `32B`,
        quantization: `Q5_K_M`,
        bpw: 5.70,
        file_size_bytes: 23_214_832_288,
        context_length: 32_768,
        layers: 64,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `unsloth/Qwen3-32B-GGUF`,
        file_name: `Qwen3-32B-Q5_K_M.gguf`,
        featured: false,
        license: `Apache-2.0`,
        category: `ultra`,
    },

]


// ─── Memory estimation ──────────────────────────────────────────────────────────

// Fixed overhead for llama.cpp runtime (scratch buffers, compute graph, etc.)
const RUNTIME_OVERHEAD = 300_000_000

// Default context for memory fitness checks — models advertise max context
// (e.g. 131K) but users typically start with short conversations. Using a
// conservative default prevents the KV cache from dominating the estimate
// and disqualifying models that easily fit at practical context lengths.
const DEFAULT_ESTIMATION_CONTEXT = 2048

/**
 * Estimate total runtime memory for a model (weights + KV cache + overhead).
 *
 * Uses real architecture parameters when available:
 *   file_size_bytes + KV_cache(layers, kv_heads, head_dim, ctx) + 300 MB overhead
 *
 * Falls back to the classic `file_size × 1.2` heuristic for custom models
 * that lack architecture data.
 *
 * @param {ModelDefinition} model - The model definition
 * @param {number} [context_length] - Override context length (defaults to 2048 for practical estimation)
 * @returns {number} Estimated total memory in bytes
 */
export const estimate_model_memory = ( model, context_length ) => {

    const ctx = context_length ?? DEFAULT_ESTIMATION_CONTEXT

    // If architecture params are present, compute KV cache properly
    // KV cache = 2 × layers × kv_heads × head_dim × context × 2 bytes (FP16)
    if( model.layers && model.kv_heads && model.head_dim ) {
        const kv_cache = 2 * model.layers * model.kv_heads * model.head_dim * ctx * 2
        return model.file_size_bytes + kv_cache + RUNTIME_OVERHEAD
    }

    // Fallback: crude heuristic for custom models without architecture data
    return Math.ceil( model.file_size_bytes * 1.2 )

}

/**
 * Check whether a model fits within a memory budget.
 * @param {ModelDefinition} model
 * @param {number} max_bytes - Available memory from estimate_max_model_bytes()
 * @param {number} [context_length] - Override context length
 * @returns {boolean}
 */
export const can_fit_in_memory = ( model, max_bytes, context_length ) =>
    estimate_model_memory( model, context_length ) <= max_bytes


// ─── Selection & filtering ──────────────────────────────────────────────────────

/**
 * Select the best model that fits in the available memory.
 *
 * Strategy: biggest parameter count wins, then highest bpw (quant quality).
 * If nothing fits, returns the smallest model as a fallback.
 *
 * @param {number} available_bytes - Memory budget from estimate_max_model_bytes()
 * @param {Object} [opts]
 * @param {boolean} [opts.featured_only=false] - Only consider featured models
 * @returns {ModelDefinition}
 */
export const select_best_model = ( available_bytes, { featured_only = false } = {} ) => {

    const candidates = featured_only
        ? MODEL_CATALOG.filter( m => m.featured )
        : MODEL_CATALOG

    // Models that fit, sorted by parameter count desc → bpw desc
    const fitting = candidates
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .sort( ( a, b ) => b.parameters - a.parameters || b.bpw - a.bpw )

    if( fitting.length > 0 ) return fitting[ 0 ]

    // Nothing fits — return the smallest model as a graceful fallback
    return [ ...candidates ].sort( ( a, b ) => a.file_size_bytes - b.file_size_bytes )[ 0 ]

}

/**
 * Get all featured models (for the selection UI).
 * @returns {ModelDefinition[]}
 */
export const get_featured_models = () =>
    MODEL_CATALOG.filter( m => m.featured )

/**
 * Get all models that fit in the available memory, sorted best-first.
 * @param {number} available_bytes - Memory budget
 * @returns {ModelDefinition[]}
 */
export const get_fitting_models = ( available_bytes ) =>
    MODEL_CATALOG
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .sort( ( a, b ) => b.parameters - a.parameters || b.bpw - a.bpw )


// ─── Pair selection ──────────────────────────────────────────────────────────────

/**
 * Select a smarter/faster model pair for the two-card recommendation UI.
 *
 * - **smarter** = biggest featured model that fits (same as `select_best_model`)
 * - **faster**  = biggest featured model that fits AND is ≤50% the file size of smarter
 *
 * The 50% threshold ensures meaningful differentiation between the two cards.
 * If no meaningfully smaller model exists, `faster` is `null` → UI falls back
 * to a single recommendation card.
 *
 * @param {number} available_bytes - Memory budget from estimate_max_model_bytes()
 * @returns {{ smarter: ModelDefinition, faster: ModelDefinition | null }}
 */
export const select_model_pair = ( available_bytes ) => {

    const smarter = select_best_model( available_bytes, { featured_only: true } )

    // Find the biggest featured model that fits AND is ≤50% the smarter model's file size
    const half_size = smarter.file_size_bytes * 0.5

    const faster_candidates = MODEL_CATALOG
        .filter( m => m.featured && m.id !== smarter.id )
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .filter( m => m.file_size_bytes <= half_size )
        .sort( ( a, b ) => b.parameters - a.parameters || b.bpw - a.bpw )

    const faster = faster_candidates[ 0 ] ?? null

    return { smarter, faster }

}


// ─── Download time estimation ────────────────────────────────────────────────────

/**
 * Estimate download time for a model file.
 *
 * Uses `navigator.connection.downlink` (Mbps, Chromium/Electron) when available
 * for a concrete time estimate. Falls back to qualitative labels for Safari/Firefox.
 *
 * @param {number} file_size_bytes - GGUF file size in bytes
 * @returns {string} Human-readable download time estimate
 */
export const estimate_download_time = ( file_size_bytes ) => {

    // Try Network Information API (Chromium + Electron)
    const downlink = navigator?.connection?.downlink

    if( downlink && downlink > 0 ) {

        // downlink is in Mbps — convert to bytes per second, apply 70% efficiency
        const bytes_per_second =  downlink * 1_000_000 / 8  * 0.7
        const seconds = file_size_bytes / bytes_per_second

        if( seconds < 60 ) return `less than a minute`
        if( seconds < 120 ) return `about 1 minute`

        const minutes = Math.round( seconds / 60 )
        if( minutes < 60 ) return `about ${ minutes } minutes`

        const hours = Math.floor( minutes / 60 )
        const remaining = minutes % 60
        if( remaining === 0 ) return `about ${ hours }h`
        return `about ${ hours }h ${ remaining }m`

    }

    // Fallback: qualitative labels for browsers without Network Information API
    // Phrased as durations to work in "Initial download takes ..." context
    if( file_size_bytes < 500_000_000 ) return `under a minute`
    if( file_size_bytes < 2_000_000_000 ) return `1–3 minutes`
    if( file_size_bytes < 5_000_000_000 ) return `3–8 minutes`
    if( file_size_bytes < 15_000_000_000 ) return `10–20 minutes`
    if( file_size_bytes < 30_000_000_000 ) return `20–40 minutes`
    return `40+ minutes`

}


// ─── Formatting ─────────────────────────────────────────────────────────────────

/**
 * Format bytes into human-readable size (e.g. "4.6 GB")
 * @param {number} bytes
 * @returns {string}
 */
export const format_file_size = ( bytes ) => {
    if( bytes >= 1_000_000_000 ) return `${ ( bytes / 1_000_000_000 ).toFixed( 1 ) } GB`
    if( bytes >= 1_000_000 ) return `${ ( bytes / 1_000_000 ).toFixed( 0 ) } MB`
    return `${ ( bytes / 1_000 ).toFixed( 0 ) } KB`
}
