import { defineConfig } from '@playwright/test'

export default defineConfig( {
    testDir: `./electron`,
    timeout: 120_000,
    expect: { timeout: 60_000 },
    fullyParallel: false,
    retries: 1,
} )
