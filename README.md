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
