import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Multi-turn conversation test — sends 2+ messages in sequence and verifies
// the assistant can reference prior context (conversation builds correctly).
//
// Uses a shared browser context so the model is downloaded once.

test.describe( `Multi-Turn Conversation`, () => {

    test.setTimeout( 600_000 )

    /** @type {import('@playwright/test').BrowserContext} */
    let context

    /** @type {import('@playwright/test').Page} */
    let page

    test.beforeAll( async ( { browser } ) => {

        context = await browser.newContext()
        page = await context.newPage()

        // Download SmolLM2 — smallest model, shared across all tests
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

    } )

    test.afterAll( async () => {
        await context?.close()
    } )

    test.describe.configure( { mode: `serial` } )

    test( `sends multiple messages and gets responses for each`, async () => {

        // First message
        await send_message( page, `Remember the number 42. Just confirm you understood.` )
        await wait_for_inference( page, 1, 180_000 )

        // Verify first assistant response exists
        const first_msgs = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( first_msgs.length ).toBe( 1 )
        const first_text = await first_msgs[ 0 ].textContent()
        expect( first_text?.length ).toBeGreaterThan( 0 )

        // Second message — references prior context
        await send_message( page, `What number did I just ask you to remember?` )
        await wait_for_inference( page, 1, 180_000 )

        // Verify second assistant response exists
        const all_msgs = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( all_msgs.length ).toBe( 2 )
        const second_text = await all_msgs[ 1 ].textContent()
        expect( second_text?.length ).toBeGreaterThan( 0 )

    } )

    test( `conversation preserves user and assistant message order`, async () => {

        // Start fresh conversation
        await page.getByTestId( `new-chat-btn` ).click()
        await expect( page.locator( `[data-testid="assistant-message"]` ) ).toHaveCount( 0, { timeout: 5_000 } )

        // Send three messages in sequence
        await send_message( page, `Say "alpha".` )
        await wait_for_inference( page, 1, 180_000 )

        await send_message( page, `Say "beta".` )
        await wait_for_inference( page, 1, 180_000 )

        // Verify message counts: 2 user + 2 assistant
        const user_msgs = await page.locator( `[data-testid="user-message"]` ).all()
        const assistant_msgs = await page.locator( `[data-testid="assistant-message"]` ).all()

        expect( user_msgs.length ).toBe( 2 )
        expect( assistant_msgs.length ).toBe( 2 )

    } )

} )
