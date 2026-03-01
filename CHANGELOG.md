# Changelog

## [0.20.1] - 2026-03-01

### Fixed
- Fix 4-card grid layout rendering 3+1 instead of 2×2 (0920649)

## [0.20.0] - 2026-03-01

### Added
- Vision model card on model selection page — promotes best-fitting vision model alongside Faster, Smarter, and Uncensored
- 4 vision models in catalog: SmolVLM2 2.2B, Gemma 3 4B IT, Qwen 2.5 VL 3B, Qwen 2.5 VL 7B
- `select_best_vision()` memory-aware selection engine for vision models
- File attachment in chat input — paperclip button reads text files (40+ extensions, 100 KB limit)
- Attachment chip UI with filename display and remove button
- Image file rejection toast with "coming soon" message (pending engine support)
- Vision and file attachment translations across all 11 locales
- E2E tests for vision card visibility, selection, and file attachment flow

### Changed
- Card row layout widens to 1120px when 4 cards are shown
- Theme palette gains `info` color (soft blue) for vision-related UI elements
- `select_model_options` returns `{ smarter, faster, uncensored, vision }`

## [0.19.1] - 2026-03-01

### Fixed
- Balance mic and send button visual weight — mic button gets subtle fill background
- Remove vertical separator line to the left of input buttons on wide screens
- Center SVG icons vertically within circular action buttons

## [0.19.0] - 2026-03-01

### Added
- Mobile model selector in sidebar — declutters TopBar on small screens
- "Change Model" button shows icon-only on mobile (text hidden)

## [0.18.2] - 2026-03-01

### Fixed
- Strip superfluous `<think>` prefix from completed responses when model never emits closing tag

## [0.18.1] - 2026-03-01

### Fixed
- Close sidebar on mobile after tapping "new chat" or a conversation

## [0.18.0] - 2026-03-01

### Added
- "Waking up the AI" animated indicator during TTFT gap before first token arrives
- Slow device warning nudges web users toward the Desktop app when tok/s < 2

### Fixed
- tok/s now excludes TTFT — measures decode speed only, reports `ttft_ms` and `decode_ms` in stats

## [0.17.3] - 2026-03-01

### Changed
- Add ~45 level-gated log calls across 12 files — covers downloads, IPC, DB, settings, audio, and model resolution
- Upgrade mentie 0.2.38 → 0.5.4 — adds `log.insane()` and `log.debug()` levels
- Move raw prompt dump from `log.info` to `log.insane` to reduce noise

## [0.17.2] - 2026-03-01

### Changed
- Replace 31 raw `console.*` calls with mentie `log` utility for level-gated, prefixed logging across 9 source files

## [0.17.1] - 2026-02-28

### Changed
- Center low-memory warning layout with icon above text and increased bottom spacing
- Rewrite low-memory warning text to be friendlier and more concise across all 11 locales

## [0.17.0] - 2026-02-28

### Added
- Uncensored option card on model selection screen — promotes best-fitting uncensored model to a first-class recommendation alongside Faster and Smarter
- `select_best_uncensored()` selection engine for memory-aware uncensored model picking
- Translations for uncensored option card in all 11 locales

### Changed
- Rename `select_model_pair` → `select_model_options` returning `{ smarter, faster, uncensored }`
- Card row layout widens to 960px when 3 cards are shown

## [0.16.0] - 2026-02-28

### Added
- Benchmark scores for 7 models that previously showed none (SmolLM2, TinyLlama, Llama 3.2 1B, DeepSeek R1 1.5B, and 3 uncensored models)
- `/100` denominator on all displayed benchmark scores for clarity

## [0.15.3] - 2026-02-28

### Fixed
- Remove nested scroll trap on mobile ModelSelectPage expand panel
- Auto-scroll alternatives panel into view when expanded on mobile

## [0.15.2] - 2026-02-28

### Fixed
- Use streaming TextDecoder for wllama output to prevent Unicode replacement chars on multi-byte boundaries

## [0.15.1] - 2026-02-28

### Fixed
- Remove rectangular focus outline inside rounded chat input pill
- Use fixed height instead of min-height on #root to prevent layout overflow

## [0.15.0] - 2026-02-28

### Added
- Chat input auto-focus on page load, conversation switch, and generation complete
- Type-ahead support — textarea stays enabled during generation, queuing next message

## [0.13.3] - 2026-02-27

### Fixed
- Two-pass model loading — reload model for clean VRAM when context halving fails
- Cap initial context request to 2048 to avoid cascading createContext failures
- Propagate non-VRAM errors immediately instead of retrying

## [0.14.1] - 2026-02-28

### Fixed
- Chat input now retains focus after sending a message

## [0.14.0] - 2026-02-28

### Added
- Low free RAM warning on model select page — Electron users see a banner when available memory can't cover the selected model plus 20% headroom
- `low_memory_warning` i18n key across all 11 locales

## [0.13.2] - 2026-02-27

### Fixed
- Conservative memory budgets for model recommendations — Apple Silicon 75→65%, CPU-only 70→60%
- Runtime overhead raised to 500 MB to account for Electron and V8 heap
- Context size floor lowered to 512 tokens for last-resort VRAM recovery

## [0.13.0] - 2026-02-27

### Added
- Language selector globe on WelcomePage (b36112a)
- Worker console forwarding and graceful shutdown (c2c8f9d)

### Changed
- DesktopAppBanner restyled with inverted theme colors and accent pill button (dbb6f03)

## [0.12.0] - 2026-02-27

### Added
- 10 new languages: Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Dutch (nl), Polish (pl), Russian (ru), Japanese (ja), Chinese Simplified (zh)
- 222 translation keys per language across 5 namespaces (common, chat, settings, models, pages)
- Browser language auto-detection for all supported languages
- Language selector now lists all 11 languages

## [0.11.0] - 2026-02-27

### Added
- i18n support via `react-i18next` — all ~300 user-facing strings extracted to 5 namespace JSON files
- Globe language selector in TopBar — extensible for future languages, English shipped by default
- `use_language` hook for language persistence to localStorage
- Electron IPC for system locale detection (`system:locale`)
- `format_stats` and `format_time` accept optional `t` param for translated output

## [0.10.0] - 2026-02-27

### Added
- "Check for updates" button in Electron sidebar — replaces web-only "Download App" link with manual update check
- `update-not-available` IPC event forwarding from main process to renderer

## [0.9.5] - 2026-02-26

### Fixed
- VRAM crash when loading models with large context windows — auto-retry with halved context size until it fits

## [0.9.4] - 2026-02-26

### Fixed
- Off-center wobble in loading spinners — replace lucide `Loader` with `LoaderCircle` which is balanced for rotation

## [0.9.2] - 2026-02-26

### Fixed
- h1 accent border-bottom not rendering — move from global rule to each styled.h1 component to win CSS specificity

## [0.9.1] - 2026-02-26

### Fixed
- Infinite "Loading model..." hang after switching model mid-load then navigating back

## [0.9.0] - 2026-02-26

### Added
- Custom typography — Montserrat for headings, Nunito for body text, self-hosted via @fontsource-variable

## [0.8.0] - 2026-02-26

### Added
- Switch-model icon during model loading on homepage — cancel in-progress load and pick a different model

## [0.7.1] - 2026-02-26

### Fixed
- ERR_FILE_NOT_FOUND for lazy-loaded chunks in Electron — skip less-lazy prefetch where it has no value

## [0.7.0] - 2026-02-26

### Added
- History sidebar toggle on homepage — access conversation history without navigating to `/chat`

## [0.6.3] - 2026-02-26

### Added
- Download-started confirmation modal on `/get-app` page — shows filename and install hint after clicking download

## [0.6.0] - 2026-02-26

### Added
- "Download App" button in web sidebar — links to `/get-app`, hidden in Electron

## [0.5.0] - 2026-02-26

### Added
- Direct per-platform download links on `/get-app` page
- Versionless artifact names for stable GitHub download URLs
- Intel Mac footnote on download page for legacy hardware users

### Changed
- Release body uses `/releases/latest/download/` URLs instead of versioned paths
- macOS card label from "Universal" to "Apple Silicon (M1–M4)"
- Intel Mac de-emphasised to collapsed section in release notes

## [0.4.4] - 2026-02-26

### Changed
- Move technical README to DOCUMENTATION.md, replace with user-friendly README

## [0.4.3] - 2026-02-26

### Fixed
- Electron UI freeze during model load — move inference to utilityProcess child process

## [0.4.0] - 2026-02-25

### Added
- unified pill-shaped input bar — textarea + buttons float inside a single rounded container
- voice input on home page — mic button, recording status, transcription via shared `ChatInput`
- `focus-within` accent border highlight on input pill
- `ChatInput` config props: `as_form`, `max_width`, `placeholder`, `auto_focus`

### Changed
- `ChatInput` pill layout replaces flat `InputContainer` (buttons inside bar, not beside it)
- `VoiceStatusBar` renders transparent — delegates visual styling to parent pill
- `InputSection` on chat page owns background/padding (prevents message bleed-through)
- home page uses `ChatInput` component instead of bespoke `SearchForm` / `SubmitButton`

## [0.3.1] - 2026-02-25

### Fixed
- "Module is already initialized" error on chat page — store dedup race condition
- stale "Failed to load model" banner on HomePage after concurrent load succeeds

## [0.3.0] - 2026-02-25

### Added
- centered chat input on empty chat — bar sits mid-screen until first message is sent
- smooth slide-to-bottom animation when user submits first message (flex-grow transition)
- welcome text + suggestions collapse with opacity/max-height transition on submit
- `prefers-reduced-motion` support — all chat input transitions respect user preference

## [0.2.2] - 2026-02-25

### Fixed
- "Failed to load model" banner persists after successful load — clear error on store confirmation
- "Module is already initialised" WASM error — skip reload when model already loaded and healthy
- viewport overflow when DesktopAppBanner visible — replace 100dvh with flex-based layout
- banner text low contrast (white on teal) — switch to dark text for WCAG AA compliance
- banner shown on mobile where desktop app promo is useless — hide via JS + CSS media query
- search bar submit button misaligned with textarea — match box model (border, min-height, align-self)

## [0.2.1] - 2026-02-25

### Fixed
- returning users seeing onboarding instead of HomePage — stop clearing `active_model_id` on transient load failure
- HomePage shows inline error banner with Retry / Choose another on model load failure
- ModelSelectPage skips download page round-trip for already-cached models

## [0.2.0] - 2026-02-25

### Added
- Google-style search home page for returning users — preloads model on mount
- Zustand LLM store for shared provider state across pages (`llm_store.js`)
- model load deduplication — navigating from HomePage to ChatPage reuses in-flight load

### Changed
- `use_llm` hook rewritten as thin wrapper around Zustand store (same API)
- ChatPage auto-load simplified — leans on store dedup instead of `load_started_ref`
- WelcomePage renders HomePage (lazy-loaded) when `active_model_id` exists

## [0.1.0] - 2026-02-25

### Added
- desktop app promo banner in web version — hidden in Electron, dismissible with localStorage persistence
- `/get-app` download page with OS-detected platform cards linking to GitHub Releases
- `DesktopAppBanner` atom component matching `UpdateBanner` visual style
- `GetAppPage` standalone page with macOS/Windows/Linux download cards

## [0.0.11] - 2026-02-25

### Added
- auto-update via electron-updater — checks GitHub Releases on launch
- update banner between TopBar and MainArea (download / install / dismiss)
- `use_auto_updater` hook for update lifecycle state
- macOS `.zip` target for electron-updater compatibility
- CI uploads `latest*.yml` manifests + `.zip` artifacts to GitHub Releases
