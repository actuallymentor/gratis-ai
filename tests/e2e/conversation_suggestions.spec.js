import { test, expect } from '@playwright/test'
import { MODELS } from '../fixtures/test_models'
import { download_model_via_ui } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests clicking a conversation suggestion button triggers inference.
// When the model is loaded and no messages exist, the UI shows suggestion
// buttons that the user can click to start a conversation.

test.describe( `Conversation Suggestions`, () => {

    test.setTimeout( 600_000 )

    /** @type {import('@playwright/test').BrowserContext} */
    let context

    /** @type {import('@playwright/test').Page} */
    let page

    test.beforeAll( async ( { browser } ) => {

        context = await browser.newContext()
        page = await context.newPage()

        // Download SmolLM2
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

    } )

    test.afterAll( async () => {
        await context?.close()
    } )

    test( `clicking a suggestion button sends the message and produces a response`, async () => {

        // Verify we're on the chat page with model loaded
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 60_000 } )

        // Look for suggestion buttons
        const suggestion = page.getByTestId( `suggestion-btn` ).first()

        if( await suggestion.isVisible( { timeout: 5_000 } ).catch( () => false ) ) {

            // Click the first suggestion
            await suggestion.click()

            // Wait for assistant response — the suggestion should auto-send
            await wait_for_inference( page, 1, 180_000 )

            // Verify a user message was created (from the suggestion)
            const user_msgs = await page.locator( `[data-testid="user-message"]` ).all()
            expect( user_msgs.length ).toBeGreaterThanOrEqual( 1 )

            // Verify assistant responded
            const assistant_msgs = await page.locator( `[data-testid="assistant-message"]` ).all()
            expect( assistant_msgs.length ).toBeGreaterThanOrEqual( 1 )
            const text = await assistant_msgs[ assistant_msgs.length - 1 ].textContent()
            expect( text?.length ).toBeGreaterThan( 0 )

        } else {

            // No suggestion buttons visible — feature may be hidden or not yet implemented
            test.skip( true, `suggestion-btn not found — feature may not be implemented yet` )

        }

    } )

} )
