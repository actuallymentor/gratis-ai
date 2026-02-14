import { test, expect } from '@playwright/test'

test.describe( `Chat Page`, () => {

    test( `loads with empty state`, async ( { page } ) => {
        await page.goto( `/chat` )
        await expect( page.getByText( `Ask me anything` ) ).toBeVisible()
    } )

    test( `shows chat input`, async ( { page } ) => {
        await page.goto( `/chat` )
        await expect( page.getByTestId( `chat-input` ) ).toBeVisible()
    } )

    test( `send button is disabled when input is empty`, async ( { page } ) => {
        await page.goto( `/chat` )
        await expect( page.getByTestId( `send-btn` ) ).toBeDisabled()
    } )

    test( `shows no model banner when no model loaded`, async ( { page } ) => {
        await page.goto( `/chat` )
        // Use the more specific text to avoid matching the model selector dropdown
        await expect( page.getByText( `No model loaded. Go to the welcome page` ) ).toBeVisible()
    } )

    test( `chat input is disabled when no model loaded`, async ( { page } ) => {
        await page.goto( `/chat` )
        await expect( page.getByTestId( `chat-input` ) ).toBeDisabled()
    } )

} )
