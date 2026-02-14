import { test, expect } from '@playwright/test'

test.describe( `Settings Modal`, () => {

    test( `opens settings via gear icon`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `settings-modal` ) ).toBeVisible()
    } )

    test( `shows three tabs`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `settings-tab-basic` ) ).toBeVisible()
        await expect( page.getByTestId( `settings-tab-advanced` ) ).toBeVisible()
        await expect( page.getByTestId( `settings-tab-models` ) ).toBeVisible()
    } )

    test( `basic tab shows temperature slider`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `temperature-slider` ) ).toBeVisible()
    } )

    test( `basic tab shows system prompt input`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `system-prompt-input` ) ).toBeVisible()
    } )

    test( `closes settings on escape key`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await expect( page.getByTestId( `settings-modal` ) ).toBeVisible()
        await page.keyboard.press( `Escape` )
        await expect( page.getByTestId( `settings-modal` ) ).not.toBeVisible()
    } )

    test( `switching tabs shows different content`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()

        // Click Advanced tab
        await page.getByTestId( `settings-tab-advanced` ).click()
        await expect( page.getByText( `Top P`, { exact: true } ) ).toBeVisible()

        // Click Models tab
        await page.getByTestId( `settings-tab-models` ).click()
        await expect( page.getByTestId( `clear-all-data-btn` ) ).toBeVisible()
    } )

    test( `models tab shows add model preset button`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await page.getByTestId( `settings-tab-models` ).click()
        await expect( page.getByTestId( `add-model-preset-btn` ) ).toBeVisible()
    } )

} )
