import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests the "Clear all data" flow: send a message → open Settings → Models tab
// → expand danger zone → click "Clear all data" → verify conversations cleared,
// model unloaded, and the setup CTA appears.

test.describe( `Clear All Data`, () => {

    test.setTimeout( 600_000 )

    test( `clearing all data resets the app to initial state`, async ( { page } ) => {

        // Download model and send a message
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        // Verify we have a response before clearing
        const pre_msgs = await page.locator( `[data-testid="assistant-message"]` ).all()
        expect( pre_msgs.length ).toBeGreaterThanOrEqual( 1 )

        // Open Settings → Models tab
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `settings-modal` ) ).toBeVisible()
        await page.getByTestId( `settings-tab-models` ).click()

        // Expand the danger zone
        await page.getByTestId( `danger-zone-toggle` ).click()
        await expect( page.getByTestId( `clear-all-data-btn` ) ).toBeVisible()

        // Click "Clear all data" — may require a confirmation dialog
        await page.getByTestId( `clear-all-data-btn` ).click()

        // Handle confirmation dialog if one appears
        const confirm_btn = page.getByTestId( `clear-all-data-confirm-btn` )
        if( await confirm_btn.isVisible( { timeout: 2_000 } ).catch( () => false ) ) {
            await confirm_btn.click()
        }

        // Wait for the app to reset — settings modal should close
        await expect( page.getByTestId( `settings-modal` ) ).not.toBeVisible( { timeout: 10_000 } )

        // App should show the setup CTA (no model loaded state)
        await expect( page.getByTestId( `setup-model-btn` ) ).toBeVisible( { timeout: 10_000 } )

        // Conversations should be cleared — no assistant messages visible
        await expect( page.locator( `[data-testid="assistant-message"]` ) ).toHaveCount( 0, { timeout: 5_000 } )

        // Chat input should be disabled (no model loaded)
        await expect( page.getByTestId( `send-btn` ) ).toBeDisabled()

    } )

} )
