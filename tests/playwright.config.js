import { defineConfig } from '@playwright/test'

export default defineConfig( {
    testDir: `./e2e`,
    timeout: 120_000,
    expect: { timeout: 60_000 },
    fullyParallel: false,
    retries: 1,
    use: {
        baseURL: `http://localhost:5173`,
        headless: true,
        viewport: { width: 1280, height: 720 },
        actionTimeout: 30_000,
    },
    webServer: {
        command: `npm run dev`,
        port: 5173,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
} )
