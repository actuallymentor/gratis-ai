# LLM Memory Requirements Reference

Calculated 2026-02-22. All sizes in GiB (1 GiB = 1024^3 bytes).

## Formulas Used

- **File size** = (parameters x bits_per_weight) / 8 + overhead
- **KV cache** = 2 x num_layers x num_kv_heads x head_dim x context_length x bytes_per_element
- **Total memory** = model file + KV cache + runtime overhead (~0.3-0.5 GiB)

## Key Takeaways

- KV cache at long contexts can rival or exceed model weight size (e.g., 70B at 32K ctx = 10 GiB KV in FP16)
- Q4 KV cache quantization cuts KV overhead by 4x vs FP16, with minimal quality loss
- The 3.4 GiB WASM browser cap means max ~7-8B at aggressive quants, or ~3B at Q8
- For 8 GiB devices (M1, RTX 3060 8GB): sweet spot is 7-8B at Q4_K_M with 4-8K context
- For 24 GiB (RTX 4090): can run up to 32B at Q5_K_M or 70B at Q4_K_M (tight at long ctx)
