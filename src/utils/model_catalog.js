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
 * 5. Run `npm run build` to verify no issues
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
 * @property {boolean} reasoning - Whether the model supports native thinking/reasoning mode (<think> tags)
 * @property {string} license - License identifier
 * @property {boolean} [uncensored] - Whether this model has had refusal behavior removed
 * @property {string} [category] - Legacy tier label for backward compat with cached IndexedDB data
 * @property {Benchmarks} [benchmarks] - Benchmark scores (null = unavailable for that benchmark)
 */

/**
 * @typedef {Object} Benchmarks
 * @property {number|null} mmlu      - Massive Multitask Language Understanding (0-100)
 * @property {number|null} gpqa      - Graduate-level Google-Proof Q&A (0-100)
 * @property {number|null} humaneval - Code generation — HumanEval / EvalPlus (0-100)
 * @property {number|null} math      - Competition-level math (0-100)
 * @property {number|null} gsm8k     - Grade school math (0-100)
 */


// ─── The catalog ────────────────────────────────────────────────────────────────

/**
 * Complete model catalog — all preset models available in gratisAI.
 * The selection engine picks from the full catalog based on memory budget.
 * @type {ModelDefinition[]}
 */
export const MODEL_CATALOG = [

    // ── Sub-1B models ─────────────────────────────────────────────────────

    {
        id: `smollm2-360m-q4km`,
        name: `SmolLM2 360M Instruct`,
        description: `Tiniest instruct model. Perfect for CI testing and ultra-low-resource devices.`,
        family: `smollm`,
        parameters: 362_000_000,
        parameters_label: `0.36B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 259_915_680,
        context_length: 8_192,
        layers: 32,
        kv_heads: 5,
        head_dim: 64,
        hugging_face_repo: `bartowski/SmolLM2-360M-Instruct-GGUF`,
        file_name: `SmolLM2-360M-Instruct-Q4_K_M.gguf`,
        reasoning: false,
        benchmarks: null,
        license: `Apache-2.0`,
        category: `lightweight`,
    },

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
        reasoning: true,
        benchmarks: { mmlu: 52.8, gpqa: 26.8, humaneval: 36.2, math: 32.4, gsm8k: 59.6 },
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    // ── 1–2B models ──────────────────────────────────────────────────────

    {
        id: `tinyllama-1.1b-q4km`,
        name: `TinyLlama 1.1B Chat`,
        description: `Compact Llama variant with Zephyr chat template. Fast inference on any device.`,
        family: `llama`,
        parameters: 1_100_000_000,
        parameters_label: `1.1B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 643_728_768,
        context_length: 2_048,
        layers: 22,
        kv_heads: 4,
        head_dim: 64,
        hugging_face_repo: `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF`,
        file_name: `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`,
        reasoning: false,
        benchmarks: null,
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    {
        id: `llama-3.2-1b-q4km`,
        name: `Llama 3.2 1B Instruct`,
        description: `Meta's smallest Llama 3 model. Modern architecture with 128K context support.`,
        family: `llama3`,
        parameters: 1_236_000_000,
        parameters_label: `1B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 775_647_360,
        context_length: 131_072,
        layers: 16,
        kv_heads: 8,
        head_dim: 64,
        hugging_face_repo: `bartowski/Llama-3.2-1B-Instruct-GGUF`,
        file_name: `Llama-3.2-1B-Instruct-Q4_K_M.gguf`,
        reasoning: false,
        benchmarks: null,
        license: `Llama`,
        category: `lightweight`,
    },

    {
        id: `deepseek-r1-1.5b-q4km`,
        name: `DeepSeek R1 Distill Qwen 1.5B`,
        description: `Reasoning-capable distillation of DeepSeek R1. Supports chain-of-thought via <think> tags.`,
        family: `qwen2`,
        parameters: 1_777_000_000,
        parameters_label: `1.5B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 1_071_584_864,
        context_length: 131_072,
        layers: 28,
        kv_heads: 2,
        head_dim: 128,
        hugging_face_repo: `bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF`,
        file_name: `DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`,
        reasoning: true,
        benchmarks: null,
        license: `MIT`,
        category: `lightweight`,
    },

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
        reasoning: true,
        benchmarks: { mmlu: 62.6, gpqa: 28.3, humaneval: 52.7, math: 43.5, gsm8k: 75.4 },
        license: `Apache-2.0`,
        category: `lightweight`,
    },

    // ── 3B models ───────────────────────────────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 53.5, gpqa: 35.7, humaneval: 30.5, math: 46.1, gsm8k: 67.6 },
        license: `Apache-2.0`,
        category: `medium`,
    },

    // ── 4B models ───────────────────────────────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 73.0, gpqa: 36.9, humaneval: 63.5, math: 54.1, gsm8k: 87.8 },
        license: `Apache-2.0`,
        category: `medium`,
    },

    // ── 8B models ───────────────────────────────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 76.9, gpqa: 44.4, humaneval: 67.7, math: 60.8, gsm8k: 89.8 },
        license: `Apache-2.0`,
        category: `heavy`,
    },

    // ── 14B models ──────────────────────────────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 81.1, gpqa: 39.9, humaneval: 72.2, math: 62.0, gsm8k: 92.5 },
        license: `Apache-2.0`,
        category: `heavy`,
    },

    // ── 32B models ──────────────────────────────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 83.6, gpqa: 49.5, humaneval: 72.1, math: 61.6, gsm8k: 93.4 },
        license: `Apache-2.0`,
        category: `ultra`,
    },

    // ── 70B models ──────────────────────────────────────────────────────

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
        reasoning: false,
        benchmarks: { mmlu: 86.0, gpqa: 50.5, humaneval: 88.4, math: 77.0, gsm8k: null },
        license: `Llama`,
        category: `ultra`,
    },


    // ── Higher-quality quantization variants ────────────────────────────

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
        reasoning: true,
        benchmarks: { mmlu: 52.8, gpqa: 26.8, humaneval: 36.2, math: 32.4, gsm8k: 59.6 },
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
        reasoning: false,
        benchmarks: { mmlu: 67.3, gpqa: 30.4, humaneval: 74.4, math: 64.0, gsm8k: 88.6 },
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
        reasoning: true,
        benchmarks: { mmlu: 53.5, gpqa: 35.7, humaneval: 30.5, math: 46.1, gsm8k: 67.6 },
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
        reasoning: true,
        benchmarks: { mmlu: 76.9, gpqa: 44.4, humaneval: 67.7, math: 60.8, gsm8k: 89.8 },
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
        reasoning: true,
        benchmarks: { mmlu: 81.1, gpqa: 39.9, humaneval: 72.2, math: 62.0, gsm8k: 92.5 },
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
        reasoning: true,
        benchmarks: { mmlu: 83.6, gpqa: 49.5, humaneval: 72.1, math: 61.6, gsm8k: 93.4 },
        license: `Apache-2.0`,
        category: `ultra`,
    },


    // ── Uncensored models ────────────────────────────────────────────────
    // Models with refusal behavior removed via training or abliteration.
    // See MODEL_SELECTION.md §6 for methodology notes.

    {
        id: `dolphin-2.9.4-llama3.1-8b-q4km`,
        name: `Dolphin 2.9.4 Llama 3.1 8B`,
        description: `Training-based uncensored model. Follows all instructions without refusal.`,
        family: `llama3`,
        parameters: 8_000_000_000,
        parameters_label: `8B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 4_920_746_784,
        context_length: 131_072,
        layers: 32,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `bartowski/dolphin-2.9.4-llama3.1-8b-GGUF`,
        file_name: `dolphin-2.9.4-llama3.1-8b-Q4_K_M.gguf`,
        reasoning: false,
        license: `Llama`,
        uncensored: true,
    },

    {
        id: `gemma3-12b-abliterated-q4km`,
        name: `Gemma 3 12B Abliterated`,
        description: `Abliterated medium-tier model. Gemma 3 quality without content restrictions.`,
        family: `gemma3`,
        parameters: 12_000_000_000,
        parameters_label: `12B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 7_300_778_336,
        context_length: 131_072,
        layers: 48,
        kv_heads: 4,
        head_dim: 256,
        hugging_face_repo: `mlabonne/Gemma-3-12B-it-abliterated-GGUF`,
        file_name: `gemma-3-12b-it-abliterated.q4_k_m.gguf`,
        reasoning: false,
        license: `Gemma`,
        uncensored: true,
    },

    {
        id: `dolphin-mistral-24b-venice-q4km`,
        name: `Dolphin Mistral 24B Venice`,
        description: `Gold standard uncensored model. 2.20% refusal rate — near-zero restrictions.`,
        family: `mistral`,
        parameters: 24_000_000_000,
        parameters_label: `24B`,
        quantization: `Q4_K_M`,
        bpw: 4.85,
        file_size_bytes: 14_333_909_376,
        context_length: 32_768,
        layers: 40,
        kv_heads: 8,
        head_dim: 128,
        hugging_face_repo: `bartowski/cognitivecomputations_Dolphin-Mistral-24B-Venice-Edition-GGUF`,
        file_name: `cognitivecomputations_Dolphin-Mistral-24B-Venice-Edition-Q4_K_M.gguf`,
        reasoning: false,
        license: `Apache-2.0`,
        uncensored: true,
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


// ─── Quality scoring ─────────────────────────────────────────────────────────────

const BENCHMARK_FIELDS = [ `mmlu`, `gpqa`, `humaneval`, `math`, `gsm8k` ]

/**
 * Composite quality score from benchmark data.
 * Simple average of all non-null scores. Custom models without
 * benchmarks return 0 (sort below scored models).
 *
 * @param {ModelDefinition} model
 * @returns {number} 0-100, higher is better
 */
export const quality_score = ( model ) => {

    if( !model.benchmarks ) return 0

    const scores = BENCHMARK_FIELDS
        .map( k => model.benchmarks[ k ] )
        .filter( v => v != null )

    if( !scores.length ) return 0

    return scores.reduce( ( sum, v ) => sum + v, 0 ) / scores.length

}


// ─── Selection & filtering ──────────────────────────────────────────────────────

/**
 * Select the best model that fits in the available memory.
 *
 * Strategy: highest quality score wins, then highest bpw (quant quality).
 * If nothing fits, returns the smallest model as a graceful fallback.
 *
 * @param {number} available_bytes - Memory budget from estimate_max_model_bytes()
 * @returns {ModelDefinition}
 */
export const select_best_model = ( available_bytes ) => {

    // Exclude uncensored models from auto-recommendation — they belong in the
    // alternatives list only, never as the default suggestion
    const safe = MODEL_CATALOG.filter( m => !m.uncensored )

    // Models that fit, sorted by quality score desc → bpw desc
    const fitting = safe
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .sort( ( a, b ) => quality_score( b ) - quality_score( a ) || b.bpw - a.bpw )

    if( fitting.length > 0 ) return fitting[ 0 ]

    // Nothing fits — return the smallest model as a graceful fallback
    return [ ...safe ].sort( ( a, b ) => a.file_size_bytes - b.file_size_bytes )[ 0 ]

}

/**
 * Get all models that fit in the available memory, sorted best-first.
 * @param {number} available_bytes - Memory budget
 * @returns {ModelDefinition[]}
 */
export const get_fitting_models = ( available_bytes ) =>
    MODEL_CATALOG
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .sort( ( a, b ) => quality_score( b ) - quality_score( a ) || b.bpw - a.bpw )


// ─── Pair selection ──────────────────────────────────────────────────────────────

/**
 * Select a smarter/faster model pair for the two-card recommendation UI.
 *
 * - **smarter** = highest-quality model that fits (same as `select_best_model`)
 * - **faster**  = highest-quality model that fits AND is ≤50% the file size of smarter
 *
 * The 50% threshold ensures meaningful differentiation between the two cards.
 * If no meaningfully smaller model exists, `faster` is `null` → UI falls back
 * to a single recommendation card.
 *
 * @param {number} available_bytes - Memory budget from estimate_max_model_bytes()
 * @returns {{ smarter: ModelDefinition, faster: ModelDefinition | null }}
 */
export const select_model_pair = ( available_bytes ) => {

    const smarter = select_best_model( available_bytes )

    // Find the highest-quality model that fits AND is ≤50% the smarter model's file size
    const half_size = smarter.file_size_bytes * 0.5

    const faster_candidates = MODEL_CATALOG
        .filter( m => !m.uncensored && m.id !== smarter.id )
        .filter( m => can_fit_in_memory( m, available_bytes ) )
        .filter( m => m.file_size_bytes <= half_size )
        .sort( ( a, b ) => quality_score( b ) - quality_score( a ) || b.bpw - a.bpw )

    const faster = faster_candidates[ 0 ] ?? null

    return { smarter, faster }

}


// ─── Download time estimation ────────────────────────────────────────────────────

/**
 * Estimate download time for a model file.
 *
 * Priority chain: measured speed → navigator.connection.downlink → size-based fallback.
 * Pass `measured_speed_bps` from `use_speed_estimate` for the most accurate result.
 *
 * @param {number} file_size_bytes      - GGUF file size in bytes
 * @param {number|null} measured_speed_bps - Measured download speed in bytes/sec (from speed-test hook)
 * @returns {string} Human-readable download time estimate
 */
export const estimate_download_time = ( file_size_bytes, measured_speed_bps = null ) => {

    // Best source: real measurement from the speed-test hook
    // Fallback: Network Information API (Chromium + Electron), with 70% efficiency factor
    const downlink = navigator?.connection?.downlink
    const bytes_per_second = measured_speed_bps
        || ( downlink > 0 ? downlink * 1_000_000 / 8 * 0.7 : null )

    if( bytes_per_second ) {

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
