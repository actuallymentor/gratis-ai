import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Heavy Mistral 7B test — large download (~2.7 GB) + slow CPU inference
// Tagged as heavy project in playwright.config.js for optional/nightly runs

test.describe( `Mistral 7B Inference @heavy`, () => {

    // Mistral needs 20 min download + 10 min inference
    test.setTimeout( 2_400_000 )

    test( `Mistral 7B (mistral template) — download and inference`, async ( { page } ) => {

        // Download via full UI flow — this is a ~2.7 GB download
        await download_model_via_ui( page, MODELS.mistral, { download_timeout: 1_200_000 } )

        // Verify chat is ready
        await expect( page.getByText( `What can I help with?` ) ).toBeVisible()

        // Send test prompt
        await send_message( page, TEST_PROMPT )

        // Wait for inference — Mistral is slow on CPU, give it time
        await wait_for_inference( page, 1, 600_000 )

        // Verify response
        const messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        const last = messages[ messages.length - 1 ]
        const text = await last.textContent()
        expect( text?.length ).toBeGreaterThan( 0 )

        // Verify generation stats
        await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 30_000 } )

    } )

} )
