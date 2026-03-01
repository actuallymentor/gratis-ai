# Research Notes

## Small GGUF Model Metadata (2026-02-23)

Researched exact file sizes and architecture configs for 4 small GGUF models from HuggingFace.
All file sizes verified via HF API `/api/models/{repo}/tree/main` endpoint.
All architecture configs from `/resolve/main/config.json` on source/mirror repos.

### SmolLM2 360M Instruct Q4_K_M
- **Repo:** `bartowski/SmolLM2-360M-Instruct-GGUF`
- **File:** `SmolLM2-360M-Instruct-Q4_K_M.gguf`
- **Size:** 259,915,680 bytes (248 MiB)
- **Parameters:** 361,821,120 (0.362B)
- **Architecture:** LlamaForCausalLM, 32 layers, 15 attn heads, 5 KV heads, head_dim=64, hidden=960, intermediate=2560, context=8192, vocab=49152

### TinyLlama 1.1B Chat v1.0 Q4_K_M
- **Repo:** `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF`
- **File:** `tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf`
- **Size:** 643,728,768 bytes (614 MiB)
- **Parameters:** 1,100,048,384 (1.100B)
- **Architecture:** LlamaForCausalLM, 22 layers, 32 attn heads, 4 KV heads, head_dim=64, hidden=2048, intermediate=5632, context=2048, vocab=32000

### Llama 3.2 1B Instruct Q4_K_M
- **Repo:** `bartowski/Llama-3.2-1B-Instruct-GGUF`
- **File:** `Llama-3.2-1B-Instruct-Q4_K_M.gguf`
- **Size:** 775,647,360 bytes (740 MiB)
- **Parameters:** 1,235,814,400 (1.236B)
- **Architecture:** LlamaForCausalLM, 16 layers, 32 attn heads, 8 KV heads, head_dim=64, hidden=2048, intermediate=8192, context=131072, vocab=128256

### DeepSeek R1 Distill Qwen 1.5B Q4_K_M
- **Repo:** `bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF`
- **File:** `DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf`
- **Size:** 1,071,584,864 bytes (1,022 MiB)
- **Parameters:** 1,777,030,656 (1.777B)
- **Architecture:** Qwen2ForCausalLM, 28 layers, 12 attn heads, 2 KV heads, head_dim=128, hidden=1536, intermediate=8960, context=131072, vocab=151936

---

## GGUF Quantization Quality Data (Artefact2) — 2026-02-22

Source: https://gist.github.com/Artefact2/b5f810600771265fc1e39442288e8ec9

### Key Findings

- Model benchmarked: **Mistral-7B**, imatrix from wiki.train (200x512 tokens), KL-divergence on wiki.test
- I-quants (IQ*) consistently beat K-quants at similar bpw in the 2-3 bit range
- At 4-bit, IQ4_XS (4.32 bpw) and Q4_K_S (4.57 bpw) are very close in quality
- Q5_K_M and above are nearly lossless (KL-div median ~0.004, perplexity ratio ~0)
- Q4_K_M is the most popular download; good default choice
- Author's advice: "use the largest that fully fits in your GPU. If you can comfortably fit Q4_K_S, try using a model with more parameters."

### Blind Human Testing (Bradley-Terry rankings)

Source: https://github.com/ggml-org/llama.cpp/discussions/5962

Rankings (strongest to weakest):
1. FP16 / Q6_K / Q5_K — indistinguishable from each other
2. IQ4_XS — slight but measurable quality loss
3. IQ3_XS — noticeable at this level
4. IQ2_XS — significant degradation
5. IQ1_S — clearly worse than all others

### Quality Tiers (practical summary)

| Tier | Quants | bpw range | Quality | Use case |
|------|--------|-----------|---------|----------|
| Near-lossless | Q6_K, Q5_K_M, Q5_K_S | 5.5-6.6 | Imperceptible loss | When VRAM allows |
| Sweet spot | Q4_K_M, Q4_K_S, IQ4_NL, IQ4_XS | 4.3-4.8 | Very good | Default choice |
| Acceptable | Q3_K_L, IQ3_M, IQ3_S, Q3_K_M | 3.5-4.2 | Good enough | VRAM-constrained |
| Aggressive | IQ3_XS, IQ3_XXS, Q3_K_S | 3.2-3.5 | Noticeable loss | Tight memory budgets |
| Extreme | IQ2_*, Q2_K* | 2.2-3.0 | Significant loss | Research / last resort |
| Unusable | IQ1_S | 1.78 | Severe loss | Not recommended |
