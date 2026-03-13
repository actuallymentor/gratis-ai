# Memory

## Electron Auto-Update (v0.22.0)

`electron-updater` v6 reads `app-update.yml` from packaged resources automatically — never call `setFeedURL()` manually. `autoDownload = true` — updates download automatically in the background. IPC handlers (`updater:check`, `updater:download`, `updater:install`) are registered unconditionally, gated by `_updater_active` flag. When download completes, `UpdateModal` prompts user to "Quit and Reopen" or cancel. `UpdateBanner` shows download progress only. `dev-app-update.yml` in project root enables local testing.

## Vision Models & File Attachment (v0.20.0)
4 vision models added to `MODEL_CATALOG` with `vision: true` — SmolVLM2 2.2B, Gemma 3 4B IT, Qwen 2.5 VL 3B, Qwen 2.5 VL 7B. Vision card on ModelSelectPage uses `info` theme color (soft blue). File attachment in ChatInput reads text files (40+ extensions, 100KB limit), image files show "coming soon" toast. Engine support for vision inference is pending. See `RESEARCH.md` for GGUF research details.

## Vision Model GGUF Research
See `RESEARCH.md` "Vision Model GGUF Research" section. Load when adding vision models to the catalog or adjusting GGUF download sizes.

## /status Chat Command (v0.24.0)

`/status` typed in the chat bar is intercepted in `ChatPage.send_message` before reaching the model. Displays loaded model info (from `get_model_by_id`), active system prompt, and system metadata. `APP_VERSION` constant in `branding.js` is injected at build time via Vite `define` from `package.json`. ESLint config extended in `eslint.config.js` to declare `__APP_VERSION__` as a global.

## Model-Specific System Prompts (v0.23.0)

`ModelDefinition` supports optional `system_prompt` field. When the active model has one, it takes priority over the global default in `ChatPage`. Currently only Dolphin Mistral 24B Venice has a model-specific prompt. `get_model_by_id()` exported from `model_catalog.js` for catalog lookups.

## RunPod API Research (2026-03-12, updated 2026-03-13)

See `RUNPOD_API_RESEARCH.md` for comprehensive API research. Load when working on RunPod/Nerd Mode features. Covers: REST management API (`rest.runpod.io/v1`), GraphQL legacy API (`api.runpod.io/graphql`), serverless job API (`api.runpod.ai/v2/{id}/`), OpenAI-compatible vLLM endpoints, GPU pool IDs, template/endpoint CRUD, health checks, streaming SSE format, vLLM env vars. **Critical**: serverless templates require explicit `volumeInGb: 0` -- see GOTCHAS.md.

## Nerd Mode — RunPod Cloud GPU Inference (v0.26.0)

Cloud GPU inference via RunPod serverless endpoints. Two-step deployment: create vLLM template (`rest.runpod.io/v1/templates`), then create endpoint referencing it (`rest.runpod.io/v1/endpoints`). Key files: `runpod_service.js` (API client), `runpod_provider.js` (LLMProvider), `runpod_store.js` (Zustand, localStorage-persisted), `NerdSetupPage.jsx` (setup wizard), `SuggestedModelsModal.jsx` (model browser). Model IDs prefixed with `runpod:` — `llm_store.js` switches provider type based on prefix. E2E tests in `nerd_mode.spec.js` require `VITE_RUNPOD_API_KEY_CI`.

## Logging

All `console.*` calls in `src/` (except `nodejs_console.js`) have been replaced with mentie's `log` utility. `electron/inference_worker.js` is excluded — it uses CJS and has its own console-forwarding relay.

Mentie 0.5.4 is installed. ~45 level-gated log calls across 12 files covering downloads, IPC, DB, settings, audio, model resolution, and export. Levels used: `log.insane` (prompt dumps), `log.debug` (IPC/DB/param/audio), `log.info` (milestones), `log.warn` (destructive/stale), `log.error` (failures). Never use bare `log()` — always use a named sublevel.
