/**
 * Test model definitions for multi-architecture E2E testing.
 * Uses Q2_K quantisation for smallest possible downloads.
 *
 * Architecture coverage:
 * - SmolLM2 360M  → ChatML template
 * - TinyLlama 1.1B → Zephyr template
 * - Llama 3.2 1B  → Llama3 template
 * - DeepSeek R1 Qwen 1.5B → ChatML template (Qwen arch)
 * - Mistral 7B    → Mistral template
 */

export const MODELS = {

    smollm2: {
        id: `smollm2-360m`,
        name: `SmolLM2 360M`,
        architecture: `smollm`,
        template: `chatml`,
        repo: `QuantFactory/SmolLM2-360M-Instruct-GGUF`,
        file_name: `SmolLM2-360M-Instruct.Q2_K.gguf`,
        url: `https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q2_K.gguf`,
        size_bytes: 200_000_000,
        tier: `fast`,
    },

    tinyllama: {
        id: `tinyllama-1.1b`,
        name: `TinyLlama 1.1B Chat`,
        architecture: `llama`,
        template: `zephyr`,
        repo: `QuantFactory/TinyLlama-1.1B-Chat-v1.0-GGUF`,
        file_name: `TinyLlama-1.1B-Chat-v1.0.Q2_K.gguf`,
        url: `https://huggingface.co/QuantFactory/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/TinyLlama-1.1B-Chat-v1.0.Q2_K.gguf`,
        size_bytes: 420_000_000,
        tier: `medium`,
    },

    llama32: {
        id: `llama-3.2-1b-instruct`,
        name: `Llama 3.2 1B Instruct`,
        architecture: `llama`,
        template: `llama3`,
        repo: `bartowski/Llama-3.2-1B-Instruct-GGUF`,
        file_name: `Llama-3.2-1B-Instruct-Q2_K.gguf`,
        url: `https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q2_K.gguf`,
        size_bytes: 500_000_000,
        tier: `medium`,
    },

    deepseek: {
        id: `deepseek-r1-1.5b`,
        name: `DeepSeek R1 Distill Qwen 1.5B`,
        architecture: `qwen`,
        template: `chatml`,
        repo: `bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF`,
        file_name: `DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf`,
        url: `https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf`,
        size_bytes: 600_000_000,
        tier: `medium`,
    },

    mistral: {
        id: `mistral-7b-instruct`,
        name: `Mistral 7B Instruct`,
        architecture: `mistral`,
        template: `mistral`,
        repo: `TheBloke/Mistral-7B-Instruct-v0.2-GGUF`,
        file_name: `mistral-7b-instruct-v0.2.Q2_K.gguf`,
        url: `https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q2_K.gguf`,
        size_bytes: 2_700_000_000,
        tier: `heavy`,
    },

}

// Convenience arrays for test iteration
export const FAST_MODELS = [ MODELS.smollm2 ]
export const MEDIUM_MODELS = [ MODELS.tinyllama, MODELS.llama32, MODELS.deepseek ]
export const HEAVY_MODELS = [ MODELS.mistral ]
export const ALL_INFERENCE_MODELS = [ MODELS.smollm2, MODELS.tinyllama, MODELS.llama32, MODELS.deepseek ]

// Test prompt designed to produce short, verifiable responses across all architectures
export const TEST_PROMPT = `What is 2+2? Answer with just the number.`
export const LONG_PROMPT = `Write a detailed essay about the history of mathematics, covering ancient civilisations, the development of algebra, calculus, and modern mathematics. Include specific dates, names of mathematicians, and their contributions.`
