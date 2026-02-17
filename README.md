# localLM

> Run AI locally. Your data never leaves your device.

A privacy-first chat app that runs open-source LLMs entirely on your device. Works in the browser (WASM via [wllama](https://github.com/nicoly/wllama)) or as a desktop app (native via [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) in Electron).

## Quick Start

```bash
nvm use
npm install
npm run dev
# Open http://localhost:5173
```

## Electron

The Electron build uses native inference instead of WASM, removing the ~3.4 GB browser memory ceiling.

```bash
# Dev with hot-reload
npm run dev:electron

# Package for distribution
npm run build:electron
```

Configure build targets by creating an `electron-builder.yml`:

```yaml
appId: com.locallm.app
productName: localLM
mac:
  target: dmg
linux:
  target: AppImage
win:
  target: nsis
```

The Electron code lives in `electron/` — `main.js` (window + IPC), `preload.js` (context bridge), and `native_inference.js` (node-llama-cpp wrapper). The renderer auto-detects Electron at runtime and swaps providers.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (browser) |
| `npm run build` | Production build (browser) |
| `npm run dev:electron` | Electron dev with hot-reload |
| `npm run build:electron` | Package Electron app |
| `npm run test` | Playwright E2E tests |
| `npm run lint` | ESLint with auto-fix |

## Testing

The test suite is split into fast UI tests and slower inference tests that download real models and run WASM/native inference.

### Test Projects

| Project | Runtime | What it tests |
|---------|---------|---------------|
| `ui` | ~30s | UI interactions, routing, settings, theme — no model downloads |
| `inference` | ~20-30 min | Multi-architecture WASM inference, model switching, abort, chat history, settings effects, deep links |
| `heavy` | ~30+ min | Mistral 7B download + inference (nightly/optional) |
| `smoke` | ~30s | Electron app launches, API exposed |
| `inference` (Electron) | ~15 min | Native node-llama-cpp inference, multi-architecture, IPC model management |

### Running Tests

```bash
# UI-only tests (fast, no downloads)
npx playwright test --config=tests/playwright.config.js --project=ui

# Browser inference tests (downloads real models, runs WASM inference)
npx playwright test --config=tests/playwright.config.js --project=inference

# Heavy Mistral test (optional, ~2.7 GB download)
npx playwright test --config=tests/playwright.config.js --project=heavy

# Electron smoke test
DISPLAY=:99 npx playwright test --config=tests/electron.config.js --project=smoke

# Electron inference tests
DISPLAY=:99 npx playwright test --config=tests/electron.config.js --project=inference
```

### Architecture Coverage

Inference tests cover all four chat template types the app supports:

| Template | Model | Test file |
|----------|-------|-----------|
| ChatML | SmolLM2 360M | `inference_multimodel.spec.js` |
| Zephyr | TinyLlama 1.1B | `inference_multimodel.spec.js` |
| Llama3 | Llama 3.2 1B | `inference_multimodel.spec.js` |
| ChatML (Qwen) | DeepSeek R1 1.5B | `inference_multimodel.spec.js` |
| Mistral | Mistral 7B | `inference_mistral.spec.js` |

### Docker / CI Setup

For running tests in Docker or CI, use the setup script:

```bash
# Install system deps (Xvfb, Chromium, cmake), start Xvfb, build node-llama-cpp
bash scripts/setup_docker_e2e.sh

# Pre-download model files to /tmp/locallm-test-models/ (speeds up Electron tests)
bash scripts/download_test_models.sh --fast    # SmolLM2 only (~200 MB)
bash scripts/download_test_models.sh --medium  # 4 models, no Mistral (~1.7 GB)
bash scripts/download_test_models.sh --all     # All 5 models (~4.4 GB)
```

### Test Structure

```
tests/
├── playwright.config.js       # Browser test config (ui, inference, heavy projects)
├── electron.config.js         # Electron test config (smoke, inference projects)
├── fixtures/
│   └── test_models.js         # Model definitions with HuggingFace URLs
├── helpers/
│   ├── wait_for_inference.js   # Poll for assistant response
│   ├── download_model.js       # UI download flow + model selection helpers
│   └── electron_helpers.js     # Electron launch, model preloading, IPC helpers
├── e2e/                        # Browser E2E tests (17 spec files)
│   ├── inference_multimodel.spec.js
│   ├── inference_mistral.spec.js
│   ├── model_switching.spec.js
│   ├── abort_generation.spec.js
│   ├── chat_history_with_inference.spec.js
│   ├── settings_with_inference.spec.js
│   ├── deep_link_with_inference.spec.js
│   ├── error_handling.spec.js
│   ├── theme_toggle.spec.js
│   └── ... (existing UI tests)
└── electron/                   # Electron E2E tests (4 spec files)
    ├── smoke.spec.js
    ├── inference.spec.js
    ├── multi_architecture.spec.js
    └── model_management.spec.js
```

## Architecture

```
src/
├── components/
│   ├── atoms/        # Stateless components
│   ├── molecules/    # Stateful components
│   └── pages/        # Route-level pages
├── hooks/            # React hooks
├── providers/        # LLM providers (wllama, electron IPC)
├── stores/           # Zustand + IndexedDB
├── styles/           # Theme + styled-components
└── utils/            # Utilities
```

## Tech Stack

React 18, Vite, styled-components, react-router, zustand, Playwright, wllama (browser), node-llama-cpp (Electron)
