import { defineConfig, loadEnv } from 'vite'

export default defineConfig( ( { mode } ) => {

    const env = loadEnv( mode, process.cwd(), `` )

    return {
        test: {
            // Load .env.development variables
            env,
            testTimeout: 600_000,
            hookTimeout: 120_000,
        },
    }

} )
