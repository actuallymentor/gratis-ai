import { test, expect } from '@playwright/test'
import { ALL_INFERENCE_MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Multi-architecture inference tests — downloads and runs 4 different model architectures
// Covers: SmolLM2 (ChatML), TinyLlama (Zephyr), Llama 3.2 (Llama3), DeepSeek R1 (ChatML/Qwen)

test.describe( `Multi-Architecture Inference`, () => {

    // Each model test: download (~2-5 min) + inference (~1-3 min)
    test.setTimeout( 600_000 )

    for( const model of ALL_INFERENCE_MODELS ) {

        test( `${ model.name } (${ model.template }) — download and inference`, async ( { page } ) => {

            // Download the model through the full onboarding UI flow
            await download_model_via_ui( page, model, { download_timeout: 300_000 } )

            // Verify chat is ready
            await expect( page.getByText( `What can I help with?` ) ).toBeVisible()

            // Send test prompt
            await send_message( page, TEST_PROMPT )

            // Wait for the assistant to produce a response
            await wait_for_inference( page, 1, 180_000 )

            // Verify response is non-empty
            const messages = await page.locator( `[data-testid="assistant-message"]` ).all()
            const last = messages[ messages.length - 1 ]
            const text = await last.textContent()
            expect( text?.length ).toBeGreaterThan( 0 )

            // Verify generation stats are shown (confirms the inference pipeline completed)
            await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 30_000 } )

        } )

    }

} )
