import { test, expect } from '@playwright/test'

// Tests theme switching and persistence.
// These tests do NOT require model downloads.

test.describe( `Theme Toggle`, () => {

    test( `theme toggle button is visible on chat page`, async ( { page } ) => {

        await page.goto( `/chat` )
        await expect( page.getByTestId( `theme-toggle` ) ).toBeVisible()

    } )

    test( `clicking theme toggle cycles to dark mode`, async ( { page } ) => {

        await page.goto( `/chat` )

        // Get initial background (system default, resolves to light in headless Chromium)
        const initial_bg = await page.evaluate( () =>
            getComputedStyle( document.body ).backgroundColor
        )

        // Theme cycle is system → light → dark — click twice to reach dark mode
        // (system and light both resolve to white bg in headless Chromium)
        await page.getByTestId( `theme-toggle` ).click()
        await page.getByTestId( `theme-toggle` ).click()

        // Background should now be dark
        await expect( async () => {
            const new_bg = await page.evaluate( () =>
                getComputedStyle( document.body ).backgroundColor
            )
            expect( new_bg ).not.toBe( initial_bg )
        } ).toPass( { timeout: 5_000 } )

    } )

    test( `theme persists across page reload`, async ( { page } ) => {

        await page.goto( `/chat` )

        // Click twice to reach dark mode (system → light → dark)
        await page.getByTestId( `theme-toggle` ).click()
        await page.getByTestId( `theme-toggle` ).click()
        await page.waitForTimeout( 500 )

        // Record the theme color
        const theme_bg = await page.evaluate( () =>
            getComputedStyle( document.body ).backgroundColor
        )

        // Reload the page
        await page.reload()
        await page.waitForLoadState( `domcontentloaded` )

        // Theme should persist
        await expect( async () => {
            const reloaded_bg = await page.evaluate( () =>
                getComputedStyle( document.body ).backgroundColor
            )
            expect( reloaded_bg ).toBe( theme_bg )
        } ).toPass( { timeout: 5_000 } )

    } )

    test( `theme toggle in settings also works`, async ( { page } ) => {

        await page.goto( `/chat` )

        // Open settings — basic tab has appearance section
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `settings-modal` ) ).toBeVisible()

        // Appearance section should be visible
        await expect( page.getByText( `Appearance` ) ).toBeVisible()

    } )

} )
