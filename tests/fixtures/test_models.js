/**
 * Test model definitions for multi-architecture E2E testing.
 *
 * IMPORTANT: These must match the model_registry.js definitions — the UI
 * download flow always uses the registry's repo/file/quantisation, not these.
 * These fixtures are used to identify models by name in the UI and to set
 * correct timeouts based on real file sizes.
 *
 * Architecture coverage:
 * - SmolLM2 360M  → ChatML template (Q4_K_M, ~271 MB)
 * - TinyLlama 1.1B → Zephyr template (Q4_K_M, ~670 MB)
 * - Llama 3.2 1B  → Llama3 template (Q4_K_M, ~808 MB)
 * - DeepSeek R1 Qwen 1.5B → ChatML template (Q4_K_M, ~1.1 GB)
 * - Mistral 7B    → Mistral template (Q5_K_M, ~5.1 GB)
 */

export const MODELS = {

    smollm2: {
        id: `smollm2-360m`,
        name: `SmolLM2 360M`,
        architecture: `smollm`,
        template: `chatml`,
        size_mb: 271,
        tier: `fast`,
    },

    tinyllama: {
        id: `tinyllama-1.1b`,
        name: `TinyLlama 1.1B Chat`,
        architecture: `llama`,
        template: `zephyr`,
        size_mb: 670,
        tier: `medium`,
    },

    llama32: {
        id: `llama-3.2-1b-instruct`,
        name: `Llama 3.2 1B Instruct`,
        architecture: `llama`,
        template: `llama3`,
        size_mb: 808,
        tier: `medium`,
    },

    deepseek: {
        id: `deepseek-r1-1.5b`,
        name: `DeepSeek R1 Distill Qwen 1.5B`,
        architecture: `qwen`,
        template: `chatml`,
        size_mb: 1120,
        tier: `medium`,
    },

    mistral: {
        id: `mistral-7b-instruct`,
        name: `Mistral 7B Instruct`,
        architecture: `mistral`,
        template: `mistral`,
        size_mb: 5130,
        tier: `heavy`,
    },

}

// Default set for CI: SmolLM2 + TinyLlama covers two different template types
// in reasonable time (~10-15 min). Use ALL_MODELS for full coverage.
export const FAST_MODELS = [ MODELS.smollm2 ]
export const CI_MODELS = [ MODELS.smollm2, MODELS.tinyllama ]
export const MEDIUM_MODELS = [ MODELS.smollm2, MODELS.tinyllama, MODELS.llama32 ]
export const ALL_INFERENCE_MODELS = [ MODELS.smollm2, MODELS.tinyllama, MODELS.llama32, MODELS.deepseek ]
export const HEAVY_MODELS = [ MODELS.mistral ]

// Test prompt designed to produce short, verifiable responses across all architectures
export const TEST_PROMPT = `What is 2+2? Answer with just the number.`
export const LONG_PROMPT = `Write a detailed essay about the history of mathematics, covering ancient civilisations, the development of algebra, calculus, and modern mathematics. Include specific dates, names of mathematicians, and their contributions.`
