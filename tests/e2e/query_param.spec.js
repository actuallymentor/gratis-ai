import { test, expect } from '@playwright/test'

test.describe( `Query Parameter Support`, () => {

    test( `query params are cleaned from URL after processing`, async ( { page } ) => {
        await page.goto( `/chat?q=Hello` )
        // Even without a model, the params should be cleaned
        await page.waitForTimeout( 500 )
        const url = page.url()
        expect( url ).not.toContain( `q=Hello` )
    } )

    test( `model=nonexistent shows model not found toast`, async ( { page } ) => {
        await page.goto( `/chat?model=nonexistent-model-xyz` )
        await expect( page.getByText( `Model not found` ) ).toBeVisible( { timeout: 5000 } )
    } )

    test( `model param is cleaned from URL`, async ( { page } ) => {
        await page.goto( `/chat?model=some-model` )
        await page.waitForTimeout( 500 )
        const url = page.url()
        expect( url ).not.toContain( `model=` )
    } )

} )
