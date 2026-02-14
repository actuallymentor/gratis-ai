import { expect } from '@playwright/test'

/**
 * Waits for the assistant to produce at least `min_length` characters of response.
 * Polls the last assistant message bubble.
 * @param {import('@playwright/test').Page} page
 * @param {number} min_length - Minimum characters to wait for
 * @param {number} timeout - Maximum wait time in ms
 */
export async function wait_for_inference( page, min_length = 10, timeout = 90_000 ) {

    await expect( async () => {

        const messages = await page.locator( `[data-testid="assistant-message"]` ).all()
        const last_message = messages[ messages.length - 1 ]
        const text = await last_message.textContent()
        expect( text?.length ).toBeGreaterThanOrEqual( min_length )

    } ).toPass( { timeout } )

}
