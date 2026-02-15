import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig( {
    plugins: [
        react(),
        VitePWA( {
            registerType: `autoUpdate`,
            includeAssets: [ `icons/*.png` ],
            manifest: {
                name: `localLM`,
                short_name: `localLM`,
                description: `Run AI locally. Your data never leaves your device.`,
                theme_color: `#1a1a2e`,
                background_color: `#1a1a2e`,
                display: `standalone`,
                start_url: `/`,
                icons: [
                    { src: `icons/icon-192.png`, sizes: `192x192`, type: `image/png` },
                    { src: `icons/icon-512.png`, sizes: `512x512`, type: `image/png` },
                ],
            },
            workbox: {
                globPatterns: [ `**/*.{js,css,html,wasm}` ],
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/huggingface\.co\/.*/,
                        handler: `CacheFirst`,
                        options: {
                            cacheName: `hf-model-cache`,
                            expiration: { maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 },
                            cacheableResponse: { statuses: [ 0, 200 ] },
                            rangeRequests: true,
                        },
                    },
                ],
            },
        } ),
    ],
    resolve: {
        alias: {
            // wllama package has main: "index.js" but built output is in esm/
            '@wllama/wllama': path.resolve( `node_modules/@wllama/wllama/esm/index.js` ),
        },
    },
    server: {
        port: 5173,
        // COOP + COEP headers enable SharedArrayBuffer, required for multi-threaded WASM inference
        headers: {
            'Cross-Origin-Opener-Policy': `same-origin`,
            'Cross-Origin-Embedder-Policy': `require-corp`,
        },
    },
    preview: {
        headers: {
            'Cross-Origin-Opener-Policy': `same-origin`,
            'Cross-Origin-Embedder-Policy': `require-corp`,
        },
    },
} )
