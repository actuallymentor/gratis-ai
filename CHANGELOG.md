# Changelog

## [0.0.11] - 2026-02-25

### Added
- auto-update via electron-updater — checks GitHub Releases on launch
- update banner between TopBar and MainArea (download / install / dismiss)
- `use_auto_updater` hook for update lifecycle state
- macOS `.zip` target for electron-updater compatibility
- CI uploads `latest*.yml` manifests + `.zip` artifacts to GitHub Releases
