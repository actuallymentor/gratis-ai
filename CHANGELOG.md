# Changelog

## [1.3.0] - 2026-02-23

### Added
- comprehensive model catalog with 13 models and real architecture params
- proper memory estimation: weights + KV cache + 300 MB overhead
- `select_best_model()` auto-picks the best model for any memory budget
- `get_featured_models()` returns curated UI display list
- 6 featured models: Qwen3-0.6B, SmolLM3-3B, Qwen3-8B, Qwen3-14B, Qwen3-32B, Llama-3.3-70B
- 7 non-featured alternatives with higher quants and alt families

### Changed
- model selection UI now shows featured models sorted by memory fitness
- memory check uses architecture-aware formula instead of `file_size × 1.2`

### Removed
- tier system (lightweight/medium/heavy/ultra) from selection logic and UI
- `get_recommended_tier()` from device_detection.js
- `model_registry.js` replaced by `model_catalog.js`
- env var model defaults (`VITE_MODEL_*_DEFAULT`) no longer used

## [1.2.1] - 2026-02-22

### Changed
- Update color palette — primary accent to muted teal `#67a6b6`, harmonize all theme colors
- Replace hardcoded warning/error hex values with theme token references

## [1.2.0] - 2026-02-21

### Added
- Custom HuggingFace model input in model selection — paste hf.co links to load any GGUF model
- HF URL parser supporting `hf.co/org/repo:quant`, full URLs, and direct file links
- Auto-resolve model metadata (name, size, quantization) via HuggingFace API

## [1.1.0] - 2026-02-18

### Added
- Detect GPU capabilities (Metal, CUDA, Vulkan) via node-llama-cpp at startup
- Smart model recommendation based on actual memory budget, not VRAM thresholds
- Apple Silicon unified memory support — 8 GB Mac now recommends Mistral 7B
- Document model selection logic and hardware cutoffs in README

## [1.0.2] - 2026-02-18

### Fixed
- Fix large model downloads in Electron — stream to disk instead of buffering in renderer memory

## [1.0.1] - 2026-02-18

### Fixed
- Fix model selection onboarding overflow — expanded model list now scrolls within viewport
