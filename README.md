# localLM

> Run AI locally. Your data never leaves your device.

**localLM** is a privacy-first, fully offline-capable chat application that runs open-source LLM models entirely on your device. No data leaves the device. Inference runs locally — in the browser via WebAssembly/WebGPU (using wllama), or natively via node-llama-cpp when packaged as an Electron app.

## Quick Start

```bash
# Use the correct Node.js version
nvm use

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Architecture

This project follows **Atomic Design** with React:

```
src/
├── components/
│   ├── atoms/          # Stateless, presentational components
│   ├── molecules/      # Stateful, composed components
│   └── pages/          # Route-level page components
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores + IndexedDB
├── providers/          # LLM inference providers (wllama, electron)
├── routes/             # React Router configuration
├── styles/             # Theme + global styles (styled-components)
└── utils/              # Pure utility functions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser) |
| `npm run build` | Build for production (browser) |
| `npm run preview` | Preview production build |
| `npm run dev:electron` | Start Electron app in dev mode |
| `npm run build:electron` | Build packaged Electron app |
| `npm run test` | Run Playwright E2E tests |
| `npm run test:headed` | Run tests with browser visible |
| `npm run test:ui` | Run tests with Playwright UI |
| `npm run lint` | Run ESLint with auto-fix |

## Electron App

The Electron build wraps the same React UI but replaces in-browser WASM inference with native [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) running in the main process. This removes the WASM memory ceiling and gives significantly better performance on machines with a capable CPU or GPU.

### Prerequisites

Electron and its tooling are not included in the default `devDependencies` to keep the browser-only workflow lightweight. Install them before your first Electron build:

```bash
npm install --save-dev electron electron-vite electron-builder
```

`node-llama-cpp` requires native compilation. Install it separately — it will build platform-specific binaries automatically:

```bash
npm install node-llama-cpp
```

### Development

Run the Electron app with hot-reload (Vite dev server for the renderer, Electron for the main process):

```bash
npm run dev:electron
```

This starts `electron-vite dev`, which launches the renderer at `http://localhost:5173` and loads it in the Electron window. Changes to both the renderer (`src/`) and main process (`electron/`) are watched.

### Production Build

Build and package the Electron app for distribution:

```bash
npm run build:electron
```

This runs `electron-vite build` (bundles renderer + main process) followed by `electron-builder` (packages into a platform-specific installer). Output is written to `dist-electron/` by default.

To configure the build targets (DMG, AppImage, NSIS, etc.), create an `electron-builder.yml` in the project root. See the [electron-builder docs](https://www.electron.build/configuration) for options. A minimal example:

```yaml
appId: com.locallm.app
productName: localLM
directories:
  output: dist-electron
mac:
  target: dmg
linux:
  target: AppImage
win:
  target: nsis
```

### How It Works

The Electron integration lives in three files:

| File | Role |
|------|------|
| `electron/main.js` | Main process — creates the window, registers IPC handlers, manages model files on disk |
| `electron/preload.js` | Preload script — exposes a safe `window.electronAPI` bridge via `contextBridge` |
| `electron/native_inference.js` | Native inference wrapper around `node-llama-cpp` |

The renderer detects Electron at runtime via `window.electronAPI.native_inference` and swaps the WASM provider (`WllamaProvider`) for the IPC provider (`ElectronIPCProvider`), which forwards all inference calls to the main process over IPC.

Models are stored on disk at `{userData}/models/` with a JSON manifest, rather than in IndexedDB as in the browser build.

## Tech Stack

- **Framework**: React 18 with functional components and hooks
- **Build**: Vite 5
- **Styling**: styled-components with dark/light theme
- **Routing**: react-router v6
- **State**: zustand (global) + use-query-params (URL state)
- **Icons**: lucide-react
- **Inference**: @wllama/wllama (browser WASM) / node-llama-cpp (Electron)
- **Storage**: IndexedDB (models, chat history) + localStorage (settings)
- **Testing**: Playwright E2E (real inference, no mocks)

## Testing

```bash
# Install Playwright browsers
npx playwright install chromium

# Run all tests
npm run test

# Run specific test file
npx playwright test tests/e2e/welcome.spec.js
```

## Development Status

- [x] Phase 0: Git configuration
- [x] Phase 1: Project scaffolding
- [x] Phase 2: Layout & chrome
- [x] Phase 3: Welcome & device detection
- [x] Phase 4: Model selection
- [x] Phase 5: Model download & caching
- [x] Phase 6: Inference provider (browser)
- [x] Phase 7: Chat interface
- [x] Phase 8: Chat history
- [x] Phase 9: Settings
- [x] Phase 10: Multi-model management
- [x] Phase 11: Query parameter support
- [x] Phase 12: PWA setup
- [x] Phase 13: Electron integration
