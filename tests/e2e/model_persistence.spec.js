import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests the returning-user flow: download model → reload page → verify model
// auto-loads from IndexedDB cache → send message → verify inference works.

test.describe( `Model Persistence`, () => {

    test.setTimeout( 600_000 )

    /** @type {import('@playwright/test').BrowserContext} */
    let context

    /** @type {import('@playwright/test').Page} */
    let page

    test.beforeAll( async ( { browser } ) => {

        // Use a persistent context so IndexedDB survives page reloads
        context = await browser.newContext()
        page = await context.newPage()

        // Download SmolLM2 through onboarding
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

    } )

    test.afterAll( async () => {
        await context?.close()
    } )

    test.describe.configure( { mode: `serial` } )

    test( `model persists across page reload`, async () => {

        // Verify we can chat first
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        // Reload the page entirely
        await page.reload()

        // The chat page should still be accessible — model reloads from IndexedDB
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 120_000 } )

        // Send another message after reload — verifies the model actually loaded
        await send_message( page, `Say hello.` )
        await wait_for_inference( page, 1, 180_000 )

        // Verify response
        const messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( messages.length ).toBeGreaterThanOrEqual( 1 )
        const text = await messages[ messages.length - 1 ].textContent()
        expect( text?.length ).toBeGreaterThan( 0 )

    } )

    test( `navigating to /chat directly loads cached model`, async () => {

        // Navigate directly to /chat (simulates a returning user bookmarking the page)
        await page.goto( `/chat` )

        // Model should auto-load from cache — chat input becomes enabled
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 120_000 } )

        // Verify inference works
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        const messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        const text = await messages[ messages.length - 1 ].textContent()
        expect( text?.length ).toBeGreaterThan( 0 )

    } )

} )
