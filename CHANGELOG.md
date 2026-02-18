# Changelog

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
