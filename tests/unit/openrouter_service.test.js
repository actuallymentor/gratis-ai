/**
 * Unit tests for OpenRouter API service.
 *
 * Uses Vitest with fetch mocking — no real API calls.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stub browser globals for Node environment (mentie logger needs `location`)
if( typeof window === `undefined` ) {
    globalThis.location = { origin: `https://test.gratisai.app`, hostname: `test.gratisai.app` }
    globalThis.window = { location: globalThis.location }
}

// Dynamic import so window stub is in place before module evaluation
const { openrouter_headers, fetch_models, fetch_key_info, validate_api_key } = await import( `../../src/providers/openrouter_service.js` )


// ── Helpers ─────────────────────────────────────────────────────────

const TEST_KEY = `sk-or-v1-test-key-000`

const mock_fetch = ( status, body ) => {

    return vi.fn( () => Promise.resolve( {
        ok: status >= 200 && status < 300,
        status,
        statusText: `OK`,
        json: () => Promise.resolve( body ),
        text: () => Promise.resolve( JSON.stringify( body ) ),
    } ) )

}

let original_fetch


// ── Tests ───────────────────────────────────────────────────────────

describe( `openrouter_service`, () => {

    beforeEach( () => {
        original_fetch = globalThis.fetch
    } )

    afterEach( () => {
        globalThis.fetch = original_fetch
    } )


    // ── Headers ─────────────────────────────────────────────────────

    describe( `openrouter_headers()`, () => {

        it( `includes Authorization bearer token`, () => {
            const h = openrouter_headers( TEST_KEY )
            expect( h.Authorization ).toBe( `Bearer ${ TEST_KEY }` )
        } )

        it( `includes required OpenRouter attribution headers`, () => {
            const h = openrouter_headers( TEST_KEY )
            expect( h[ `HTTP-Referer` ] ).toBeTruthy()
            expect( h[ `X-Title` ] ).toBe( `gratisAI` )
            expect( h[ `Content-Type` ] ).toBe( `application/json` )
        } )

    } )


    // ── fetch_models ────────────────────────────────────────────────

    describe( `fetch_models()`, () => {

        it( `returns model list from API`, async () => {

            const models = [ { id: `test/model-a`, name: `Model A` }, { id: `test/model-b`, name: `Model B` } ]
            globalThis.fetch = mock_fetch( 200, { data: models } )

            const result = await fetch_models( TEST_KEY )
            expect( result ).toEqual( models )
            expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 )

        } )

        it( `caches results for same key`, async () => {

            const models = [ { id: `test/cached`, name: `Cached` } ]
            globalThis.fetch = mock_fetch( 200, { data: models } )

            await fetch_models( `cache-key` )
            await fetch_models( `cache-key` )

            // Second call should hit cache, not fetch
            expect( globalThis.fetch ).toHaveBeenCalledTimes( 1 )

        } )

        it( `throws on non-OK response`, async () => {

            globalThis.fetch = mock_fetch( 401, { error: `Unauthorized` } )

            await expect( fetch_models( `bad-key` ) ).rejects.toThrow( /401/ )

        } )

    } )


    // ── fetch_key_info ──────────────────────────────────────────────

    describe( `fetch_key_info()`, () => {

        it( `returns key metadata`, async () => {

            const key_info = { limit: 10, limit_remaining: 8.5, usage: 1.5 }
            globalThis.fetch = mock_fetch( 200, { data: key_info } )

            const result = await fetch_key_info( TEST_KEY )
            expect( result ).toEqual( key_info )

        } )

        it( `throws on invalid key`, async () => {

            globalThis.fetch = mock_fetch( 403, { error: `Forbidden` } )

            await expect( fetch_key_info( `bad-key` ) ).rejects.toThrow( /403/ )

        } )

    } )


    // ── validate_api_key ────────────────────────────────────────────

    describe( `validate_api_key()`, () => {

        it( `returns true for valid key`, async () => {

            globalThis.fetch = mock_fetch( 200, { data: { limit: 10 } } )

            const result = await validate_api_key( TEST_KEY )
            expect( result ).toBe( true )

        } )

        it( `returns false for invalid key`, async () => {

            globalThis.fetch = mock_fetch( 401, {} )

            const result = await validate_api_key( `bad-key` )
            expect( result ).toBe( false )

        } )

    } )

} )
