# Changelog

## [2.1.0] - 2026-02-23

### Added
- two-card "Faster / Smarter" model recommendation UI with side-by-side layout
- Qwen3-1.7B Q4_K_M to featured catalog — fills 0.6B→3B gap at 1.1 GB
- download time estimation via Network Information API with broadband fallback labels
- "Already downloaded" badge for cached models on selection page
- "Start Chatting" button when selected model is already cached

### Changed
- promote Qwen3-4B Q4_K_M to featured — fills 3B→8B gap at 2.5 GB
- featured model ladder expanded from 6 to 8 tiers
- model selection title changed to "Pick a model" with contextual subtitle

## [2.0.0] - 2026-02-23

### Added
- centralised `src/utils/branding.js` module — single source of truth for app name, storage prefixes, events, and DB name
- `DISPLAY_NAME`, `APP_PREFIX`, `STORAGE_PREFIX`, `DB_NAME`, `EVENTS`, `storage_key()` exports

### Changed
- rebrand localLM → gratisAI across all source, tests, config, and docs
- `VITE_APP_NAME` env var now drives all branded strings (UI, PWA manifest, HTML title)
- `index.html` title uses Vite template syntax `%VITE_APP_NAME%`
- `vite.config.js` reads `VITE_APP_NAME` via `loadEnv()` for PWA manifest
- localStorage keys now use `gratisai:settings:*` prefix
- IndexedDB database renamed to `gratisai-db`
- custom events renamed to `gratisai:*` namespace
- test model cache dir moved to `/tmp/gratisai-test-models/`

### Breaking
- storage key prefix changed — existing localStorage settings will not carry over
- IndexedDB name changed — existing conversations and cached models will not carry over

## [1.4.0] - 2026-02-23

### Added
- collapsible thinking block for reasoning models (Qwen3, DeepSeek-R1 distills)
- GGUF magic number validation on downloaded model files
- Electron model management via IPC — list and delete from filesystem

### Changed
- e2e tests use `waitForURL` instead of brittle `waitForTimeout`
- Playwright config supports system Chromium via env var

### Removed
- `ensure_platform_deps.js` postinstall script

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
