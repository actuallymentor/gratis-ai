import { test, expect } from '@playwright/test'
import { MODELS, TEST_PROMPT } from '../fixtures/test_models'
import { download_model_via_ui, send_message } from '../helpers/download_model'
import { wait_for_inference } from '../helpers/wait_for_inference'

// Tests chat history with real inference: conversations appear in sidebar,
// new chat clears messages, switching back restores them, deleting works.

test.describe( `Chat History with Inference`, () => {

    test.setTimeout( 600_000 )

    test( `conversation appears in sidebar after inference`, async ( { page } ) => {

        // Download model
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

        // Send a message and wait for response
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        // The conversation should now appear in the sidebar
        // Sidebar conversations have data-testid like sidebar-conversation-{id}
        const conversations = page.locator( `[data-testid^="sidebar-conversation-"]` )
        await expect( conversations.first() ).toBeVisible( { timeout: 10_000 } )

    } )

    test( `new chat clears messages, old chat restores them`, async ( { page } ) => {

        // Download model
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

        // Send a message and wait for response
        await send_message( page, `Remember the word: pineapple. Repeat it back.` )
        await wait_for_inference( page, 1, 180_000 )

        // Wait for generation stats to appear — indicates the full generation cycle
        // (including IndexedDB persist) has completed
        await expect( page.getByTestId( `generation-stats` ) ).toBeVisible( { timeout: 30_000 } )
        await page.waitForTimeout( 500 )

        // Verify assistant message exists
        const first_response = await page.locator( `[data-testid="assistant-message"]` ).first().textContent()
        expect( first_response?.length ).toBeGreaterThan( 0 )

        // Click new chat button
        await page.getByTestId( `new-chat-btn` ).click()

        // Messages should be cleared — no assistant messages visible
        await expect( page.locator( `[data-testid="assistant-message"]` ) ).toHaveCount( 0, { timeout: 5_000 } )

        // Click on the previous conversation in the sidebar to restore it
        const sidebar_item = page.locator( `[data-testid^="sidebar-conversation-"]` ).first()
        await expect( sidebar_item ).toBeVisible( { timeout: 5_000 } )
        await sidebar_item.click()

        // The old messages should be restored
        await expect( page.locator( `[data-testid="assistant-message"]` ).first() ).toBeVisible( { timeout: 10_000 } )

    } )

    test( `deleting a conversation removes it from sidebar`, async ( { page } ) => {

        // Download model
        await download_model_via_ui( page, MODELS.smollm2, { download_timeout: 300_000 } )

        // Send a message and wait for response
        await send_message( page, TEST_PROMPT )
        await wait_for_inference( page, 1, 180_000 )

        // Verify conversation appears in sidebar
        const conversations = page.locator( `[data-testid^="sidebar-conversation-"]` )
        await expect( conversations.first() ).toBeVisible( { timeout: 10_000 } )

        // Get the conversation id from the test id
        const testid = await conversations.first().getAttribute( `data-testid` )
        const conv_id = testid?.replace( `sidebar-conversation-`, `` )

        // Click the delete button once to show "Delete?" confirmation
        const delete_btn = page.getByTestId( `sidebar-delete-${ conv_id }` )
        await delete_btn.click()

        // Click again to confirm the actual deletion
        await delete_btn.click()

        // The conversation should be removed from the sidebar
        await expect( conversations ).toHaveCount( 0, { timeout: 5_000 } )

    } )

} )
