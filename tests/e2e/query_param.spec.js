import { test, expect } from '@playwright/test'

test.describe( `Query Parameter Support`, () => {

    test( `query params are cleaned from URL after processing`, async ( { page } ) => {
        await page.goto( `/chat?q=Hello` )
        // Wait for the app to clean query params from the URL
        await page.waitForURL( url => !url.search.includes( `q=Hello` ), { timeout: 5000 } )
        expect( page.url() ).not.toContain( `q=Hello` )
    } )

    // NOTE: "model not found" toast is tested in error_handling.spec.js

    test( `model param is cleaned from URL`, async ( { page } ) => {
        await page.goto( `/chat?model=some-model` )
        // Wait for the app to clean query params from the URL
        await page.waitForURL( url => !url.search.includes( `model=` ), { timeout: 5000 } )
        expect( page.url() ).not.toContain( `model=` )
    } )

} )
