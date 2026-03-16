import { test, expect } from '@playwright/test'

/**
 * Nerd Mode E2E tests — OpenRouter cloud inference.
 *
 * Requires VITE_OPENROUTER_DEV_KEY env var.
 * Uses a free model for zero-cost testing.
 */
test.describe( `Nerd Mode`, () => {

    // Generous timeout for API calls
    test.setTimeout( 120_000 )

    const api_key = process.env.VITE_OPENROUTER_DEV_KEY
    const test_model_id = `cognitivecomputations/dolphin-mistral-24b-venice-edition:free`

    // Skip if no API key is configured
    test.skip( !api_key, `VITE_OPENROUTER_DEV_KEY not set — skipping OpenRouter tests` )


    test( `navigate to nerd setup from model select`, async ( { page } ) => {

        // Go to model select page
        await page.goto( `/select-model` )
        await expect( page.getByText( `Pick a model` ) ).toBeVisible()

        // Click the Cloud GPU card
        await page.getByTestId( `nerd-mode-card` ).click()

        // Should navigate to nerd setup
        await expect( page ).toHaveURL( /\/nerd-setup/ )
        await expect( page.getByText( `Cloud Model Setup` ) ).toBeVisible()

    } )


    test( `connect to OpenRouter and chat`, async ( { page } ) => {

        await page.goto( `/nerd-setup` )

        // Fill API key
        await page.getByTestId( `openrouter-api-key` ).fill( api_key )
        await page.getByTestId( `openrouter-api-key` ).blur()

        // Wait for key validation
        await expect( page.getByText( `API key is valid` ) ).toBeVisible( { timeout: 15_000 } )

        // Fill model ID
        await page.getByTestId( `openrouter-model-id` ).fill( test_model_id )

        // Click connect
        await page.getByTestId( `connect-btn` ).click()

        // Wait for navigation to /chat
        await expect( page ).toHaveURL( /\/chat/, { timeout: 30_000 } )

        // Wait for model to be ready
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 30_000 } )

        // Send a test message
        await page.getByTestId( `chat-input` ).fill( `What is 2+2? Answer with just the number.` )
        await page.getByTestId( `send-btn` ).click()

        // Wait for streaming response
        const assistant_msg = page.locator( `[data-testid="assistant-message"]` ).first()
        await expect( assistant_msg ).toBeVisible( { timeout: 60_000 } )
        await expect( assistant_msg ).not.toHaveText( `` )

        // Verify generation stats are shown
        await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 60_000 } )

    } )


    test( `cloud model shows Cloud tag in selector`, async ( { page } ) => {

        // Set up OpenRouter config in localStorage before navigating
        await page.goto( `/` )
        await page.evaluate( ( { key, model_id } ) => {
            const config = {
                api_key: key,
                models: [ { id: `test`, openrouter_id: model_id, name: `Test Model`, created_at: Date.now() } ],
                daily_credit_limit: 5,
                system_prompt: ``,
            }
            localStorage.setItem( `gratisai:settings:openrouter_config`, JSON.stringify( config ) )
            localStorage.setItem( `gratisai:settings:active_model_id`, `openrouter:${ model_id }` )
        }, { key: api_key, model_id: test_model_id } )

        await page.goto( `/chat` )
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 30_000 } )

        // Open the model selector dropdown
        await page.getByTestId( `model-selector-dropdown` ).click()

        // Check for "Cloud" tag on the active model
        const cloud_tag = page.getByText( `Cloud` )
        await expect( cloud_tag ).toBeVisible()

    } )

} )
