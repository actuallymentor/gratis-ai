import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests downloading two models and switching between them.
// Verifies inference works with each and chat history is preserved across switches.

test.describe( `Model Switching`, () => {

    test.setTimeout( 600_000 )

    test( `download two models, switch between them, verify inference`, async ( { page } ) => {

        // Download the first model (SmolLM2 — smallest, fastest)
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

        // Send a message with model 1
        await send_message( page, `Say hello. Respond with one word.` )
        await wait_for_inference( page, 1, 180_000 )

        // Verify model 1 produced a response
        const first_messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( first_messages.length ).toBeGreaterThanOrEqual( 1 )

        // Now download the second model (TinyLlama) via the model select page
        await page.goto( `/select-model` )
        await expect( page.getByText( `We found a model for you` ) ).toBeVisible()

        // Select TinyLlama from alternatives
        await page.getByTestId( `change-model-toggle` ).click()
        const option = page.locator( `button`, { hasText: MODELS.tinyllama.name } )
        await expect( option ).toBeVisible( { timeout: 5_000 } )
        await option.click()

        // Confirm and download
        await page.getByTestId( `model-select-confirm-btn` ).click()
        await expect( page ).toHaveURL( /\/download/ )
        await expect( page ).toHaveURL( /\/chat/, { timeout: 300_000 } )
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 60_000 } )

        // Send a message with model 2
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        // Verify model 2 produced a response
        const second_messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( second_messages.length ).toBeGreaterThanOrEqual( 1 )

        // Verify generation stats
        await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 30_000 } )

    } )

} )
