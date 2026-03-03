# Memory

## Electron Auto-Update (v0.21.1)

`electron-updater` v6 reads `app-update.yml` from packaged resources automatically — never call `setFeedURL()` manually. The `owner`/`repo` fields in `electron-builder.yml` publish config ensure correct `app-update.yml` generation. IPC handlers (`updater:check`, `updater:download`, `updater:install`) are registered unconditionally in `register_ipc_handlers()`, gated by `_updater_active` flag set in `setup_auto_updater()`. `dev-app-update.yml` in project root enables local testing.

## Vision Models & File Attachment (v0.20.0)
4 vision models added to `MODEL_CATALOG` with `vision: true` — SmolVLM2 2.2B, Gemma 3 4B IT, Qwen 2.5 VL 3B, Qwen 2.5 VL 7B. Vision card on ModelSelectPage uses `info` theme color (soft blue). File attachment in ChatInput reads text files (40+ extensions, 100KB limit), image files show "coming soon" toast. Engine support for vision inference is pending. See `RESEARCH.md` for GGUF research details.

## Vision Model GGUF Research
See `RESEARCH.md` "Vision Model GGUF Research" section. Load when adding vision models to the catalog or adjusting GGUF download sizes.

## Logging

All `console.*` calls in `src/` (except `nodejs_console.js`) have been replaced with mentie's `log` utility. `electron/inference_worker.js` is excluded — it uses CJS and has its own console-forwarding relay.

Mentie 0.5.4 is installed. ~45 level-gated log calls across 12 files covering downloads, IPC, DB, settings, audio, model resolution, and export. Levels used: `log.insane` (prompt dumps), `log.debug` (IPC/DB/param/audio), `log.info` (milestones), `log.warn` (destructive/stale), `log.error` (failures). Never use bare `log()` — always use a named sublevel.
