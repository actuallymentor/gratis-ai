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

## Nerd Mode — OpenRouter Cloud Inference (v0.39.0, migrated from RunPod)

Cloud inference via OpenRouter's OpenAI-compatible API. No endpoint/GPU/template management — just an API key and model ID. Works in both Electron and browser (OpenRouter supports CORS).

**Key files**: `openrouter_service.js` (API client — `/models`, `/auth/key`, `/chat/completions`), `openrouter_provider.js` (LLMProvider with SSE streaming), `openrouter_store.js` (Zustand + localStorage, key `storage_key('openrouter_config')`), `NerdSetupPage.jsx` (setup wizard at `/nerd-setup`), `SuggestedModelsModal.jsx` (model browser).

**Model ID prefix**: `openrouter:{model_id}` — `llm_store.js` auto-switches provider type based on prefix. Cloud models from `use_model_manager.js` have `source: 'openrouter'`.

**Catalog**: 12 models have `openrouter_id` field. `get_cloud_models()` filters by `m.openrouter_id`. `find_by_openrouter_id()` for lookups.

**Purge** (v0.38.0): `ModelSelector` "Purge All Models" button clears OpenRouter store entries + local models. No cloud API teardown needed.

**E2E tests**: `nerd_mode.spec.js` uses `VITE_OPENROUTER_DEV_KEY` with free Dolphin model. No Electron guard.

**Backwards compat**: `llm_store.js` gracefully clears stale `runpod:` prefixed active_model_id from previous versions.

## Logging

All `console.*` calls in `src/` (except `nodejs_console.js`) have been replaced with mentie's `log` utility. `electron/inference_worker.js` is excluded — it uses CJS and has its own console-forwarding relay.

Mentie 0.5.4 is installed. ~45 level-gated log calls across 12 files covering downloads, IPC, DB, settings, audio, model resolution, and export. Levels used: `log.insane` (prompt dumps), `log.debug` (IPC/DB/param/audio), `log.info` (milestones), `log.warn` (destructive/stale), `log.error` (failures). Never use bare `log()` — always use a named sublevel.
