import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

// Electron smoke test — verifies the app launches and renders the UI
// Run with: npx playwright test --config=tests/electron.config.js

let app
let page

test.beforeAll( async () => {

    // Build the electron main/preload before launching
    const { execSync } = await import( `child_process` )
    execSync( `npx electron-vite build`, { cwd: path.resolve( `.` ), stdio: `pipe` } )

    // Launch the Electron app
    app = await electron.launch( {
        args: [ path.resolve( `.` ) ],
        env: {
            ...process.env,
            NODE_ENV: `production`,
        },
    } )

    // Get the first window
    page = await app.firstWindow()

    // Wait for the renderer to load
    await page.waitForLoadState( `domcontentloaded` )

} )

test.afterAll( async () => {
    if( app ) await app.close()
} )

test( `app window opens`, async () => {

    // The window should exist and have a title
    const title = await page.title()
    expect( title ).toBeTruthy()

} )

test( `renderer loads the React app`, async () => {

    // The root React container should be present
    const root = page.locator( `#root` )
    await expect( root ).toBeAttached( { timeout: 15_000 } )

} )

test( `electronAPI is exposed to renderer`, async () => {

    // The preload script should expose window.electronAPI
    const has_api = await page.evaluate( () => !!window.electronAPI )
    expect( has_api ).toBe( true )

} )

test( `electronAPI has native_inference flag`, async () => {

    const is_native = await page.evaluate( () => window.electronAPI?.native_inference )
    expect( is_native ).toBe( true )

} )
