# Changelog

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
