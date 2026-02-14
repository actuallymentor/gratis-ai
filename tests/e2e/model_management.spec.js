import { test, expect } from '@playwright/test'

test.describe( `Model Management`, () => {

    test( `model selector shows no model loaded`, async ( { page } ) => {
        await page.goto( `/chat` )
        await expect( page.getByTestId( `model-selector-dropdown` ) ).toContainText( `No model loaded` )
    } )

    test( `model selector dropdown opens on click`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `model-selector-dropdown` ).click()
        await expect( page.getByText( `Add Model` ) ).toBeVisible()
    } )

    test( `add model navigates to model select page`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `model-selector-dropdown` ).click()
        await page.getByText( `Add Model` ).click()
        await expect( page ).toHaveURL( /select-model/ )
    } )

    test( `models tab shows storage summary`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await page.getByTestId( `settings-tab-models` ).click()
        await expect( page.getByTestId( `storage-summary` ) ).toBeVisible()
    } )

    test( `models tab shows empty state when no models cached`, async ( { page } ) => {
        await page.goto( `/chat` )
        await page.getByTestId( `settings-btn` ).click()
        await page.getByTestId( `settings-tab-models` ).click()
        await expect( page.getByText( `No models cached yet` ) ).toBeVisible()
    } )

} )
