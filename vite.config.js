import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig( {
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            // wllama package has main: "index.js" but built output is in esm/
            '@wllama/wllama': path.resolve( `node_modules/@wllama/wllama/esm/index.js` ),
        },
    },
    server: {
        port: 5173,
    },
} )
