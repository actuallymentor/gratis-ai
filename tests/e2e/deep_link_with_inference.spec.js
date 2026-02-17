import { test, expect } from '@playwright/test'
import { MODELS } from '../fixtures/test_models'
import { download_model_via_ui } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests deep link query parameters with real inference:
// ?q= auto-sends a message, ?model= switches to a cached model.
//
// All tests share a single browser context so the model is downloaded once.

test.describe( `Deep Links with Inference`, () => {

    test.setTimeout( 600_000 )

    /** @type {import('@playwright/test').BrowserContext} */
    let context

    /** @type {import('@playwright/test').Page} */
    let page

    test.beforeAll( async ( { browser } ) => {

        // Single shared context — model downloads once into IndexedDB
        context = await browser.newContext()
        page = await context.newPage()

        // Download model through the full onboarding UI flow
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

    } )

    test.afterAll( async () => {
        await context?.close()
    } )

    // Tests run in order — sharing the same page and cached model
    test.describe.configure( { mode: `serial` } )

    test( `?q= auto-sends message after model is loaded`, async () => {

        // Wait for chat input to be enabled (model fully loaded and ready)
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 60_000 } )

        // Navigate to /chat with a query param — model is cached so it will reload from IndexedDB
        await page.goto( `/chat?q=What+is+the+capital+of+France` )

        // Wait for model to be ready again before expecting inference
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 120_000 } )

        // The ?q= param auto-sends the message once the model is loaded
        // Wait for an assistant response to appear
        await wait_for_inference( page, 1, 180_000 )

        // Verify the user message was sent
        const user_messages = await page.locator( `[data-testid="user-message"]` ).all()
        expect( user_messages.length ).toBeGreaterThanOrEqual( 1 )

        // Verify the assistant responded
        const assistant_messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( assistant_messages.length ).toBeGreaterThanOrEqual( 1 )
        const text = await assistant_messages[ assistant_messages.length - 1 ].textContent()
        expect( text?.length ).toBeGreaterThan( 0 )

    } )

    test( `?model= with invalid model shows toast error`, async () => {

        await page.goto( `/chat?model=nonexistent-model-xyz` )

        // The toast may render multiple times in StrictMode — use .first()
        await expect( page.getByText( `Model not found` ).first() ).toBeVisible( { timeout: 5_000 } )

    } )

} )
