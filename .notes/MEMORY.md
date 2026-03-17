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

## Cloud Inference — OpenRouter + Venice (v0.40.0)

Two cloud providers: **OpenRouter** and **Venice.ai**. Both use OpenAI-compatible APIs with CORS support, work in Electron and browser.

**Provider layer** (per provider): `{provider}_service.js` (API client), `{provider}_provider.js` (LLMProvider with SSE streaming), `{provider}_store.js` (Zustand + localStorage). Venice validates keys via `GET /models` (no `/auth/key` endpoint).

**Model ID prefixes**: `openrouter:{id}` and `venice:{id}` — `llm_store.js` routes to the correct provider via `target_type` detection. Cloud models from `use_model_manager.js` have `source: 'openrouter'` or `source: 'venice'`.

**Setup UI**: `CloudSetupPage.jsx` at `/cloud-setup?provider=openrouter|venice` — unified form with provider-specific labels, validation, and model browsing. `NerdSetupPage.jsx` re-exports CloudSetupPage for `/nerd-setup` backward compat.

**ModelSelectPage**: Split into "Local Models" and "Cloud Models" sections. Cloud section has setup cards for each provider + already-configured cloud model cards that activate and navigate to chat.

**Catalog**: `venice_id` field on `ModelDefinition`. `get_venice_cloud_models()` and `find_by_venice_id()` helpers. Dolphin Mistral 24B Venice has both `openrouter_id` and `venice_id`. Venice-only models: Llama 3.3 70B, Llama 3.1 405B, DeepSeek R1 671B, Qwen3 235B MoE.

**Purge**: Clears both OpenRouter and Venice store entries + local models.

**E2E tests**: `nerd_mode.spec.js` uses `VITE_OPENROUTER_DEV_KEY` with free Dolphin model. Venice E2E would need `VITE_VENICE_DEV_KEY`.

**Backwards compat**: `llm_store.js` still handles stale `runpod:` prefix. Old `__nerd__` sentinel removed from ModelSelectPage.

## Logging

All `console.*` calls in `src/` (except `nodejs_console.js`) have been replaced with mentie's `log` utility. `electron/inference_worker.js` is excluded — it uses CJS and has its own console-forwarding relay.

Mentie 0.5.4 is installed. ~45 level-gated log calls across 12 files covering downloads, IPC, DB, settings, audio, model resolution, and export. Levels used: `log.insane` (prompt dumps), `log.debug` (IPC/DB/param/audio), `log.info` (milestones), `log.warn` (destructive/stale), `log.error` (failures). Never use bare `log()` — always use a named sublevel.
