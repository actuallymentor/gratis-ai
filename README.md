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
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run Playwright E2E tests |
| `npm run test:headed` | Run tests with browser visible |
| `npm run test:ui` | Run tests with Playwright UI |
| `npm run lint` | Run ESLint with auto-fix |

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
- [ ] Phase 7: Chat interface
- [ ] Phase 8: Chat history
- [ ] Phase 9: Settings
- [ ] Phase 10: Multi-model management
- [ ] Phase 11: Query parameter support
- [ ] Phase 12: PWA setup
- [ ] Phase 13: Electron integration
