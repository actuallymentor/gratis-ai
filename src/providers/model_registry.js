/**
 * @typedef {Object} ModelDefinition
 * @property {string} id - Unique identifier
 * @property {'lightweight' | 'medium' | 'heavy' | 'ultra'} category
 * @property {string} name - Human-readable name
 * @property {string} description - Short description
 * @property {string} hugging_face_repo - e.g., "TheBloke/dolphin-2.6-mistral-7B-GGUF"
 * @property {string} file_name - e.g., "dolphin-2.6-mistral-7b.Q4_K_M.gguf"
 * @property {number} file_size_bytes - For download progress calculation
 * @property {number} context_length - Max context window
 * @property {string} parameters_label - e.g., "7B"
 * @property {string} quantization - e.g., "Q4_K_M"
 */

/**
 * Parse an env var model string into repo and file parts
 * Format: "org/repo/filename.gguf"
 * @param {string} env_value - The env var value
 * @returns {{ repo: string, file_name: string }}
 */
const parse_env_model = ( env_value ) => {
    const parts = env_value.split( `/` )
    const file_name = parts.pop()
    const repo = parts.join( `/` )
    return { repo, file_name }
}

// Parse defaults from env vars
const lightweight_env = import.meta.env.VITE_MODEL_LIGHTWEIGHT_DEFAULT || ``
const heavy_env = import.meta.env.VITE_MODEL_HEAVY_DEFAULT || ``
const ultra_env = import.meta.env.VITE_MODEL_ULTRA_DEFAULT || ``

const lightweight_parsed = parse_env_model( lightweight_env )
const heavy_parsed = parse_env_model( heavy_env )
const ultra_parsed = parse_env_model( ultra_env )

/**
 * Default model definitions by tier
 * @type {ModelDefinition[]}
 */
export const MODEL_REGISTRY = [
    {
        id: `smollm2-360m`,
        category: `lightweight`,
        name: `SmolLM2 360M`,
        description: `Ultra-small model for low-resource devices. Fast but limited capability.`,
        hugging_face_repo: lightweight_parsed.repo,
        file_name: lightweight_parsed.file_name,
        file_size_bytes: 260_000_000,
        context_length: 2048,
        parameters_label: `360M`,
        quantization: `Q4_K_M`,
    },
    {
        id: `tinyllama-1.1b`,
        category: `medium`,
        name: `TinyLlama 1.1B Chat`,
        description: `Good balance of quality and speed for moderate hardware.`,
        hugging_face_repo: `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF`,
        file_name: `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`,
        file_size_bytes: 670_000_000,
        context_length: 2048,
        parameters_label: `1.1B`,
        quantization: `Q4_K_M`,
    },
    {
        id: `llama-3.2-1b-instruct`,
        category: `medium`,
        name: `Llama 3.2 1B Instruct`,
        description: `Meta's compact instruction-tuned model with strong reasoning.`,
        hugging_face_repo: `bartowski/Llama-3.2-1B-Instruct-GGUF`,
        file_name: `Llama-3.2-1B-Instruct-Q4_K_M.gguf`,
        file_size_bytes: 808_000_000,
        context_length: 8192,
        parameters_label: `1B`,
        quantization: `Q4_K_M`,
    },
    {
        id: `deepseek-r1-1.5b`,
        category: `medium`,
        name: `DeepSeek R1 Distill Qwen 1.5B`,
        description: `Reasoning-focused distilled model with chain-of-thought capability.`,
        hugging_face_repo: `bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF`,
        file_name: `DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`,
        file_size_bytes: 1_120_000_000,
        context_length: 8192,
        parameters_label: `1.5B`,
        quantization: `Q4_K_M`,
    },
    {
        id: `mistral-7b-instruct`,
        category: `heavy`,
        name: `Mistral 7B Instruct`,
        description: `High-quality instruction-following model for capable hardware.`,
        hugging_face_repo: heavy_parsed.repo,
        file_name: heavy_parsed.file_name,
        file_size_bytes: 5_130_000_000,
        context_length: 32768,
        parameters_label: `7B`,
        quantization: `Q5_K_M`,
    },
    {
        id: `mixtral-8x7b-instruct`,
        category: `ultra`,
        name: `Mixtral 8x7B Instruct`,
        description: `Mixture of experts model for high-end hardware.`,
        hugging_face_repo: ultra_parsed.repo,
        file_name: ultra_parsed.file_name,
        file_size_bytes: 26_440_000_000,
        context_length: 32768,
        parameters_label: `8x7B`,
        quantization: `Q4_K_M`,
    },
]

/**
 * Get the default model for a given tier
 * @param {'lightweight' | 'medium' | 'heavy' | 'ultra'} tier
 * @returns {ModelDefinition | undefined}
 */
export const get_model_for_tier = ( tier ) =>
    MODEL_REGISTRY.find( m => m.category === tier )

/**
 * Get all available tiers and their display info
 * @returns {Array<{ tier: string, label: string, description: string }>}
 */
export const TIER_INFO = [
    { tier: `lightweight`, label: `Lightweight`, description: `Best for integrated GPUs and low-memory devices` },
    { tier: `medium`, label: `Medium`, description: `Good for 4-8 GB VRAM or 8+ GB RAM` },
    { tier: `heavy`, label: `Heavy`, description: `For discrete GPUs with 8-16 GB VRAM` },
    { tier: `ultra`, label: `Ultra`, description: `For high-end GPUs with 16+ GB VRAM` },
]

/**
 * Check whether a model's file size fits within the estimated WASM memory budget.
 * Models need roughly 1.2x their file size once loaded (weights + KV cache + overhead).
 * @param {ModelDefinition} model
 * @param {number} max_model_bytes - From estimate_max_model_bytes()
 * @returns {boolean}
 */
export const can_fit_in_memory = ( model, max_model_bytes ) =>
    model.file_size_bytes * 1.2 <= max_model_bytes

/**
 * Format bytes into human-readable size
 * @param {number} bytes
 * @returns {string}
 */
export const format_file_size = ( bytes ) => {
    if( bytes >= 1_000_000_000 ) return `${ ( bytes / 1_000_000_000 ).toFixed( 1 ) } GB`
    if( bytes >= 1_000_000 ) return `${ ( bytes / 1_000_000 ).toFixed( 0 ) } MB`
    return `${ ( bytes / 1_000 ).toFixed( 0 ) } KB`
}
