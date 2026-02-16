import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig( {

    // Main process
    main: {
        plugins: [ externalizeDepsPlugin() ],
        build: {
            rollupOptions: {
                input: path.resolve( `electron/main.js` ),
            },
        },
    },

    // Preload script
    preload: {
        plugins: [ externalizeDepsPlugin() ],
        build: {
            rollupOptions: {
                input: path.resolve( `electron/preload.js` ),
            },
        },
    },

    // Renderer (the React app)
    renderer: {
        plugins: [ react() ],
        root: `.`,
        build: {
            rollupOptions: {
                input: path.resolve( `index.html` ),
            },
        },
        resolve: {
            alias: {
                '@wllama/wllama': path.resolve( `node_modules/@wllama/wllama/esm/index.js` ),
            },
        },
        server: {
            port: 5173,
            headers: {
                'Cross-Origin-Opener-Policy': `same-origin`,
                'Cross-Origin-Embedder-Policy': `require-corp`,
            },
        },
    },

} )
