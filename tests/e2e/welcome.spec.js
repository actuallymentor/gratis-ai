import { test, expect } from '@playwright/test'

test.describe( `Welcome Page`, () => {

    test( `loads and displays app name`, async ( { page } ) => {
        await page.goto( `/` )
        await expect( page.getByText( `localLM` ) ).toBeVisible()
    } )

    test( `shows Get Started button`, async ( { page } ) => {
        await page.goto( `/` )
        await expect( page.getByTestId( `get-started-btn` ) ).toBeVisible()
    } )

    test( `navigates to model select on Get Started click`, async ( { page } ) => {
        await page.goto( `/` )
        await page.getByTestId( `get-started-btn` ).click()
        await expect( page ).toHaveURL( /\/select-model/ )
    } )

    test( `routes work correctly`, async ( { page } ) => {

        // Welcome page
        await page.goto( `/` )
        await expect( page.getByText( `localLM` ) ).toBeVisible()

        // Model select page
        await page.goto( `/select-model` )
        await expect( page.getByText( `Select a Model` ) ).toBeVisible()

        // Download page
        await page.goto( `/download` )
        await expect( page.getByText( `Downloading` ) ).toBeVisible()

        // Chat page
        await page.goto( `/chat` )
        await expect( page.getByText( `localLM` ) ).toBeVisible()

    } )

} )
