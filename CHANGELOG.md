# Changelog

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
