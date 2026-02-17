import { expect } from '@playwright/test'

/**
 * Navigate through the onboarding flow and download a specific model via the UI.
 * Goes: Welcome → Model Select → pick model → Download → Chat.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} model - Model fixture from test_models.js
 * @param {Object} [opts]
 * @param {number} [opts.download_timeout] - Max wait for download completion (ms)
 * @param {number} [opts.load_timeout] - Max wait for model to become ready (ms)
 */
export async function download_model_via_ui( page, model, opts = {} ) {

    const { download_timeout = 300_000, load_timeout = 180_000 } = opts

    // Step 1 — Welcome page
    await page.goto( `/` )
    await expect( page.getByRole( `heading`, { name: `localLM` } ) ).toBeVisible()
    await expect( page.getByTestId( `get-started-btn` ) ).toBeEnabled( { timeout: 15_000 } )
    await page.getByTestId( `get-started-btn` ).click()

    // Step 2 — Model select: expand alternatives, pick the target model
    await expect( page ).toHaveURL( /\/select-model/ )
    await select_model_on_page( page, model )

    // Step 3 — Confirm selection to start download
    await page.getByTestId( `model-select-confirm-btn` ).click()

    // Step 4 — Wait for download to complete and navigate to /chat
    await expect( page ).toHaveURL( /\/download/ )
    await expect( page.getByTestId( `download-progress-bar` ) ).toBeVisible()
    await expect( page ).toHaveURL( /\/chat/, { timeout: download_timeout } )

    // Step 5 — Wait for model to be loaded and chat input to be enabled
    await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: load_timeout } )

}

/**
 * Select a specific model on the model select page.
 * Expands the alternatives list and clicks the model by name.
 * If the model is already the recommended one, does nothing.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} model - Model fixture from test_models.js
 */
export async function select_model_on_page( page, model ) {

    // Check if the model is already recommended (shown in the card)
    const card_text = await page.locator( `h2` ).first().textContent()
    if( card_text?.includes( model.name ) ) return

    // Expand alternatives list
    await page.getByTestId( `change-model-toggle` ).click()

    // Click the model option by matching its name text
    const option = page.locator( `button`, { hasText: model.name } )
    await expect( option ).toBeVisible( { timeout: 5_000 } )
    await option.click()

}

/**
 * Navigate directly to /chat with a model already cached.
 * Skips the download flow by using the model that was already downloaded.
 * Assumes a model is already in the browser's storage.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} [opts]
 * @param {number} [opts.load_timeout] - Max wait for model ready (ms)
 */
export async function navigate_to_chat( page, opts = {} ) {

    const { load_timeout = 60_000 } = opts

    await page.goto( `/chat` )
    await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: load_timeout } )

}

/**
 * Switch to a different cached model using the model selector dropdown.
 * Assumes the model is already downloaded and cached.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} model - Model fixture to switch to
 * @param {Object} [opts]
 * @param {number} [opts.load_timeout] - Max wait for model switch (ms)
 */
export async function switch_model( page, model, opts = {} ) {

    const { load_timeout = 60_000 } = opts

    // Open model selector dropdown
    await page.getByTestId( `model-selector-dropdown` ).click()

    // Click the model option
    const option = page.locator( `[data-testid="model-selector-dropdown"]` )
        .locator( `..` )
        .locator( `button`, { hasText: model.name } )

    await option.click()

    // Wait for the model to load
    await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: load_timeout } )

}

/**
 * Send a message in the chat and return the page (for chaining).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} message - Message text to send
 */
export async function send_message( page, message ) {

    await page.getByTestId( `chat-input` ).fill( message )
    await page.getByTestId( `send-btn` ).click()

}
