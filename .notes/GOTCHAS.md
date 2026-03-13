# Gotchas

## electron-updater v6: never call setFeedURL() (2026-03-03)

electron-builder auto-generates `app-update.yml` inside the packaged app's `resources/` directory.
electron-updater v6 reads this file automatically at runtime. Calling `autoUpdater.setFeedURL()`
manually **overrides** the auto-generated config and can conflict with v6's internal resolution,
causing silent update failures.

**Fix**: Remove `setFeedURL()`, add `owner`/`repo` to the `publish` config in `electron-builder.yml`
so the generated `app-update.yml` contains correct GitHub coordinates. Add `repository` to
`package.json` as a fallback.

## Electron inference worker discards system prompt (2026-03-09)

`NativeInference.chat_stream()` extracted only the last user message content and passed it
to `LlamaChatSession.prompt()`, discarding the entire messages array including the system
prompt. Models that depend on system prompts (especially uncensored models like Dolphin
Mistral) would not respond correctly.

**Fix**: Added `_ensure_system_prompt()` which extracts the system message from the messages
array and recreates the `LlamaChatSession` with `systemPrompt` whenever it changes. The
`LlamaChatSession` class reference is stored at load time (`_LlamaChatSession`) since
node-llama-cpp is loaded via dynamic `import()`.

## Native inference VRAM context-size crash (2026-02-26)

The Electron native inference path (`inference_worker.js`) passed `model.context_length`
directly to `createContext({ contextSize })` with no VRAM check. Models like Qwen3 with
32k context would crash on GPUs with limited VRAM: "A context size of 32768 is too large
for the available VRAM".

**Fix**: Retry loop in `NativeInference.load()` — halves context size on VRAM errors
until it fits (floor: 512). The actual context size is reported back through the IPC
chain so the UI can inform the user.

**Follow-up (2026-03-09)**: The initial fix over-corrected by hard-capping context at
2048 in `main.js`. On powerful systems this wasted capacity (e.g. 2048 out of 32768).
Replaced the hard cap with `estimate_context_for_system()` — uses model architecture
data + `os.totalmem()` to estimate the largest context that fits, capped at the model's
`context_length`. The worker retry loop still catches overestimation.

## less-lazy prefetch breaks Electron chunk loading (2026-02-26)

The `less-lazy` library's `prefetch()` extracts chunk filenames from `import().toString()`
and injects `<link rel="prefetch" href="./ChunkName-hash.js">` into `<head>`. These paths
resolve relative to the HTML document, but chunks live in `assets/` — so every lazy-loaded
page triggers `ERR_FILE_NOT_FOUND` in Electron.

**Fix**: Skip prefetch in Electron entirely via `maybe_prefetch` identity wrapper in
`src/routes/Routes.jsx`. Prefetching is a network optimisation with zero value when
assets load from local disk.

## unload_model during in-flight load → zombie promise (2026-02-26)

Calling `unload_model()` while `load_model()` is in-flight kills the WASM worker
via `_wllama.exit()`. The pending `loadModel()` promise never settles, so the
store's `_load_promise` becomes a zombie. The next `load_model()` call deduplicates
against it and hangs forever.

**Fix**: `unload_model()` now clears `is_loading`, `_load_promise`, `_loading_model_id`,
`loaded_model_id`, and `error` **synchronously** before calling `provider.unload_model()`.
This ensures the next `load_model()` call creates a fresh promise.

## Zustand async IIFE dedup race (2026-02-25)

When creating a promise via `(async () => { ... })()` inside a Zustand action,
any `set()` calls inside the IIFE execute AFTER the first `await` — not synchronously.
If dedup guards read state set inside the IIFE (like `_loading_model_id`), concurrent
callers can slip through between the IIFE creation and the first `await`.

**Fix**: set ALL dedup-relevant state in a single synchronous `set()` call OUTSIDE
the IIFE, immediately after creating the promise.


## Wllama streaming emits Unicode replacement chars (2026-02-28)

`chunk.currentText` from wllama's completion stream uses `TextDecoder.decode(buffer)`
**without** `{ stream: true }`. When a multi-byte UTF-8 character (e.g. `ã` = `0xC3 0xA3`)
is split across two tokens, the first decode emits `U+FFFD` as a replacement character.
The delta logic (`new_text.slice(last_text.length)`) captures it before the next token
completes the sequence.

**Fix**: Use `chunk.piece` (raw `Uint8Array` bytes) with a streaming `TextDecoder`:
`utf8.decode(chunk.piece, { stream: true })` buffers incomplete sequences. Final
`utf8.decode()` after the loop flushes any held-back bytes.

## Chat list overflow: min-height vs height on #root (2026-02-28)

`#root` used `min-height: 100dvh` which gives an indefinite height — flex children
grow unbounded so `overflow-y: auto` on `ListContainer` never activates. Fix: change
to `height: 100dvh` so the flex chain resolves to constrained heights. Safe because
`body` already has `overflow: hidden`.

## Release created before all builds finish → 404 on latest-mac.yml (2026-03-09)

The `create-release` job created a **published** (non-draft) release immediately, but macOS
builds take ~12 minutes for code signing + notarization. electron-updater on user machines
would find the new release via `/releases/latest/` but `latest-mac.yml` wasn't uploaded yet → 404.

**Fix**: Create the release as `draft: true`. Added a `publish-release` job that runs after
all `build` matrix jobs complete, using `gh release edit --draft=false` to publish atomically.

## ipcMain.handle swallows Error details as {} (2026-03-09)

When `autoUpdater.checkForUpdates()` rejects inside an `ipcMain.handle` callback, Electron
serializes the rejection value for IPC transport. `Error` objects have non-enumerable properties
(`message`, `stack`), so they serialize as `{}` — producing the useless
`Error occurred in handler for 'updater:check': {}`.

**Fix**: Wrap `autoUpdater.checkForUpdates()` and `downloadUpdate()` in try/catch,
return plain objects `{ status: 'error', message }`. Also handle the returned status
in the renderer (`Sidebar.jsx`) since the event-based `updater:error` path may not fire
for all rejection scenarios.

## E2E test race: select_model_on_page checks text before render (2026-03-01)

`select_model_on_page` in `tests/helpers/download_model.js` called `page.locator('body').textContent()`
immediately after URL navigation — before the React component rendered. With empty page text, it
fell to Strategy 2, skipped the toggle click (not visible yet), then found model buttons inside
the still-hidden `ExpandPanel`.

**Fix**: Wait for `model-select-confirm-btn` to be visible before reading page text. Also changed
the toggle visibility check from instant `isVisible()` to `expect().toBeVisible()` with timeout.

## E2E test race: Ctrl+, shortcut test fires before handlers register (2026-03-01)

The `Ctrl+,` keyboard shortcut test pressed the key immediately after navigating to `/chat`,
before React had mounted and registered `keydown` handlers. The parallel `Ctrl+N` test worked
because it waited for `send-btn` first.

**Fix**: Added `await expect(page.getByTestId('send-btn')).toBeVisible()` before the key press.

## RunPod REST API: serverless template creation is broken (2026-03-13)

The REST API `POST /v1/templates` with `isServerless: true` is broken. The `volumeInGb` field
defaults to 20 when omitted, and the server rejects any `volumeInGb > 0` (including 0!) for
serverless templates: `"Serverless templates do not support volumeInGb."`

This means `isServerless: true` cannot be used via the REST API at all — regardless of whether
`volumeInGb` is included, omitted, or set to 0.

The GraphQL `saveTemplate` mutation works correctly with `volumeInGb: 0` + `isServerless: true`.
Required GraphQL fields: `containerDiskInGb: 20`, `dockerArgs: ""`.

**Fix**: `create_template()` in `runpod_service.js` uses the GraphQL API instead of REST.
Template deletion and endpoint CRUD still work via REST.

## RunPod endpoint name suffix breaks deduplication (2026-03-13)

RunPod appends ` -fb` (flashboot) to endpoint names. If you create an endpoint named
`gratisai-org-model`, the API stores it as `gratisai-org-model -fb`. Exact-match lookups
via `find_existing_endpoint()` will always miss, causing duplicate endpoints on redeploy.

**Fix**: Use `ep.name.startsWith(target_name)` instead of `ep.name === target_name`.

## RunPod idle timeout is in seconds (2026-03-13)

The RunPod API `idleTimeout` field is in **seconds**, not minutes. The UI stores/displays
minutes — convert with `* 60` at the API boundary in `create_endpoint()`.

## Cloudflare Pages → Workers Migration (2026-02-24)

Cloudflare deprecated Pages as a separate product in April 2025, merging it into Workers
under a unified "Applications" dashboard. Key consequences:

- **`wrangler pages deploy` may fail** with "Project not found" if the project was created
  in the new unified UI. The Pages API (`/pages/projects/`) returns empty for these projects.
- **Fix**: Use `wrangler deploy` with a `wrangler.toml` that has an `[assets]` block:
  ```toml
  name = "project-name"
  compatibility_date = "2026-02-24"

  [assets]
  directory = "./dist"
  ```
- **`_headers` file still works** with Workers Static Assets for setting response headers
  (COOP, COEP, etc.), but only for static responses — not Worker-generated responses.
- **API token scope**: When creating tokens, the template is now "Edit Cloudflare Workers"
  (not "Edit Cloudflare Pages"). Ensure the token has Pages + Workers permissions under
  Account Resources for the correct account.
- **Custom domains**: Add via the dashboard under the application's Settings → Domains & Routes.
  Cloudflare auto-creates DNS records if the domain is already on Cloudflare DNS.

### References
- https://blog.cloudflare.com/pages-and-workers-are-converging-into-one-experience/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/headers/
