import { test, expect } from '@playwright/test'

test.describe( `Welcome Page`, () => {

    test( `loads and displays app name`, async ( { page } ) => {
        await page.goto( `/` )
        await expect( page.getByRole( `heading`, { name: `localLM` } ) ).toBeVisible()
    } )

    test( `shows Get Started button`, async ( { page } ) => {
        await page.goto( `/` )
        await expect( page.getByTestId( `get-started-btn` ) ).toBeVisible()
    } )

    test( `shows device capabilities`, async ( { page } ) => {
        await page.goto( `/` )
        // Device info should appear after detection
        await expect( page.getByTestId( `device-info` ) ).toBeVisible( { timeout: 10_000 } )
    } )

    test( `navigates to model select on Get Started click`, async ( { page } ) => {
        await page.goto( `/` )
        // Wait for detection to finish (button becomes enabled)
        await expect( page.getByTestId( `get-started-btn` ) ).toBeEnabled( { timeout: 10_000 } )
        await page.getByTestId( `get-started-btn` ).click()
        await expect( page ).toHaveURL( /\/select-model/ )
    } )

    test( `routes work correctly`, async ( { page } ) => {

        // Welcome page
        await page.goto( `/` )
        await expect( page.getByRole( `heading`, { name: `localLM` } ) ).toBeVisible()

        // Model select page
        await page.goto( `/select-model` )
        await expect( page.getByText( `Select a Model` ) ).toBeVisible()

        // Download page redirects to model select when no model in state
        await page.goto( `/download` )
        await expect( page ).toHaveURL( /\/select-model/ )

        // Chat page
        await page.goto( `/chat` )
        await expect( page.getByText( `Ask me anything` ) ).toBeVisible()

    } )

} )
