import { test, expect } from '@playwright/test'

test.describe( `Chat Page`, () => {

    test( `shows no-model setup CTA when no model loaded`, async ( { page } ) => {
        await page.goto( `/chat` )
        // Should show the actionable "Let's get you set up" heading
        await expect( page.getByText( `Let's get you set up` ) ).toBeVisible()
        // Should show the "Set up a model" button
        await expect( page.getByTestId( `setup-model-btn` ) ).toBeVisible()
    } )

    test( `setup model button navigates to welcome page`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `setup-model-btn` ).click()
        await expect( page ).toHaveURL( `/` )
    } )

    test( `chat input is disabled when no model loaded`, async ( { page } ) => {
        await page.goto( `/chat` )
        // The chat input should exist but be disabled
        await expect( page.getByTestId( `send-btn` ) ).toBeDisabled()
    } )

} )
