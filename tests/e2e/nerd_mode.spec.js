import { test, expect } from '@playwright/test'
import { MODELS } from '../fixtures/test_models'

/**
 * Nerd Mode E2E tests — RunPod cloud GPU inference.
 *
 * Requires VITE_RUNPOD_API_KEY_CI env var.
 * Uses SmolLM2-135M-Instruct as a tiny, fast-starting test model.
 */
test.describe( `Nerd Mode`, () => {

    // Long timeout for cold starts (cloud GPU spin-up can take 1-5 minutes)
    test.setTimeout( 600_000 )

    const api_key = process.env.VITE_RUNPOD_API_KEY_CI
    const test_model = MODELS.runpod_smollm2

    // Skip if no API key is configured
    test.skip( !api_key, `VITE_RUNPOD_API_KEY_CI not set — skipping RunPod tests` )

    // Track created resources for cleanup
    let created_endpoint_id = null
    let created_template_id = null


    test( `navigate to nerd setup from model select`, async ( { page } ) => {

        // Go to model select page
        await page.goto( `/select-model` )
        await expect( page.getByText( `Pick a model` ) ).toBeVisible()

        // Click the Cloud GPU card
        await page.getByTestId( `nerd-mode-card` ).click()

        // Should navigate to nerd setup
        await expect( page ).toHaveURL( /\/nerd-setup/ )
        await expect( page.getByText( `Cloud GPU Setup` ) ).toBeVisible()

    } )


    test( `deploy endpoint and chat`, async ( { page } ) => {

        await page.goto( `/nerd-setup` )

        // Fill API key
        await page.getByTestId( `runpod-api-key` ).fill( api_key )

        // Fill model name
        await page.getByTestId( `runpod-model-name` ).fill( test_model.hf_repo )
        await page.getByTestId( `runpod-model-name` ).blur()

        // Wait for model validation
        await expect( page.getByTestId( `suggested-gpu` ) ).toBeVisible( { timeout: 30_000 } )

        // Deploy endpoint
        await page.getByTestId( `deploy-endpoint-btn` ).click()

        // Wait for deploy to complete and navigate to /chat
        await expect( page ).toHaveURL( /\/chat/, { timeout: 120_000 } )

        // Wait for model to load (cold start)
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 300_000 } )

        // Send a test message
        await page.getByTestId( `chat-input` ).fill( `What is 2+2? Answer with just the number.` )
        await page.getByTestId( `send-btn` ).click()

        // Wait for streaming response
        const assistant_msg = page.locator( `[data-testid="assistant-message"]` ).first()
        await expect( assistant_msg ).toBeVisible( { timeout: 120_000 } )
        await expect( assistant_msg ).not.toHaveText( `` )

        // Verify generation stats are shown
        await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 120_000 } )

        // Extract endpoint ID from localStorage for cleanup
        const model_id = await page.evaluate( () =>
            localStorage.getItem( `gratisai:settings:active_model_id` )
        )

        if( model_id?.startsWith( `runpod:` ) ) {
            created_endpoint_id = model_id.replace( `runpod:`, `` )
        }

        // Get template ID from stored config
        const config = await page.evaluate( () => {
            const raw = localStorage.getItem( `gratisai:settings:runpod_config` )
            return raw ? JSON.parse( raw ) : null
        } )

        if( config?.endpoints?.length ) {
            created_template_id = config.endpoints[ 0 ].template_id
        }

    } )


    test( `runpod model shows cloud tag in selector`, async ( { page } ) => {

        // Skip if no endpoint was created (previous test didn't run)
        test.skip( !created_endpoint_id, `No endpoint created` )

        await page.goto( `/chat` )
        await expect( page.getByTestId( `chat-input` ) ).toBeEnabled( { timeout: 300_000 } )

        // Open the model selector dropdown
        await page.getByTestId( `model-selector-dropdown` ).click()

        // Check for "RunPod" tag on the active model
        const cloud_tag = page.getByText( `Cloud` )
        await expect( cloud_tag ).toBeVisible()

    } )


    // Cleanup: delete endpoint and template after all tests
    test.afterAll( async () => {

        if( !api_key ) return

        // Delete endpoint
        if( created_endpoint_id ) {
            try {
                await fetch( `https://rest.runpod.io/v1/endpoints/${ created_endpoint_id }`, {
                    method: `DELETE`,
                    headers: { Authorization: `Bearer ${ api_key }` },
                } )
            } catch ( err ) {
                console.warn( `Failed to delete endpoint ${ created_endpoint_id }:`, err.message )
            }
        }

        // Delete template
        if( created_template_id ) {
            try {
                await fetch( `https://rest.runpod.io/v1/templates/${ created_template_id }`, {
                    method: `DELETE`,
                    headers: { Authorization: `Bearer ${ api_key }` },
                } )
            } catch ( err ) {
                console.warn( `Failed to delete template ${ created_template_id }:`, err.message )
            }
        }

    } )

} )
