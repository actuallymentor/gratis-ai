import { test, expect } from '@playwright/test'
import { FAST_MODELS, CI_MODELS, ALL_INFERENCE_MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Multi-architecture inference tests — downloads and runs real model inference.
//
// Default: SmolLM2 only (~25s) — covers full UI download + ChatML inference.
// Tiers controlled by env vars:
//   CI_INFERENCE=1        → SmolLM2 + TinyLlama (~15 min, needs > 1 GB browser memory)
//   FULL_INFERENCE=1      → All 4 architectures (~40+ min, needs > 2 GB browser memory)

const models = process.env.FULL_INFERENCE
    ? ALL_INFERENCE_MODELS
    : process.env.CI_INFERENCE
        ? CI_MODELS
        : FAST_MODELS

test.describe( `Multi-Architecture Inference`, () => {

    for( const model of models ) {

        test( `${ model.name } (${ model.template }) — download and inference`, async ( { page } ) => {

            // Scale timeouts with model size — ~1 second per MB download + loading + inference
            const download_timeout = Math.max( 300_000, model.size_mb * 1_000 )
            test.setTimeout( download_timeout + 300_000 )

            // Download the model through the full onboarding UI flow
            await download_model_via_ui( page, model, { download_timeout } )

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
