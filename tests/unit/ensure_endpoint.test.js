/**
 * Unit tests for get_endpoint() and ensure_endpoint() — mocked fetch,
 * no real RunPod API calls.
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    get_endpoint,
    ensure_endpoint,
    GPU_POOLS,
} from '../../src/providers/runpod_service.js'


// ─── Fetch mock ──────────────────────────────────────────────────────────────

let fetch_mock

beforeEach( () => {
    fetch_mock = vi.fn()
    vi.stubGlobal( `fetch`, fetch_mock )
} )

afterEach( () => {
    vi.restoreAllMocks()
} )


// ─── Helpers ─────────────────────────────────────────────────────────────────

const json_response = ( body, status = 200 ) => ( {
    ok: status >= 200 && status < 300,
    status,
    statusText: `OK`,
    json: () => Promise.resolve( body ),
    text: () => Promise.resolve( JSON.stringify( body ) ),
} )

const error_response = ( status, body = `` ) => ( {
    ok: false,
    status,
    statusText: `Error`,
    json: () => Promise.resolve( {} ),
    text: () => Promise.resolve( body ),
} )


// ─── get_endpoint ────────────────────────────────────────────────────────────

describe( `get_endpoint`, () => {

    test( `returns endpoint object on 200`, async () => {

        const ep = { id: `ep-123`, name: `my-endpoint` }
        fetch_mock.mockResolvedValueOnce( json_response( ep ) )

        const result = await get_endpoint( `key`, `ep-123` )

        expect( result ).toEqual( ep )
        expect( fetch_mock ).toHaveBeenCalledOnce()
        expect( fetch_mock.mock.calls[ 0 ][ 0 ] ).toContain( `/endpoints/ep-123` )

    } )

    test( `returns null on 404`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 404 ) )

        const result = await get_endpoint( `key`, `ep-gone` )

        expect( result ).toBeNull()

    } )

    test( `throws on 401`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 401, `Unauthorized` ) )

        await expect( get_endpoint( `bad-key`, `ep-123` ) )
            .rejects.toThrow( /401/ )

    } )

    test( `throws on 500`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 500, `Internal` ) )

        await expect( get_endpoint( `key`, `ep-123` ) )
            .rejects.toThrow( /500/ )

    } )

} )


// ─── ensure_endpoint ─────────────────────────────────────────────────────────

describe( `ensure_endpoint`, () => {

    test( `returns unchanged when endpoint exists`, async () => {

        const ep = { id: `ep-123`, name: `test` }
        fetch_mock.mockResolvedValueOnce( json_response( ep ) )

        const result = await ensure_endpoint( `key`, {
            endpoint_id: `ep-123`,
            model_name: `Qwen/Qwen3-8B`,
            gpu_id: `24gb`,
        } )

        expect( result ).toEqual( { endpoint_id: `ep-123`, template_id: null, changed: false } )
        // Only one fetch call — the existence check
        expect( fetch_mock ).toHaveBeenCalledOnce()

    } )

    test( `throws when endpoint deleted and no gpu_id`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 404 ) )

        await expect( ensure_endpoint( `key`, {
            endpoint_id: `ep-gone`,
            model_name: `Qwen/Qwen3-8B`,
        } ) ).rejects.toThrow( /missing GPU tier/ )

    } )

    test( `throws for unknown gpu_id`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 404 ) )

        await expect( ensure_endpoint( `key`, {
            endpoint_id: `ep-gone`,
            model_name: `Qwen/Qwen3-8B`,
            gpu_id: `999gb`,
        } ) ).rejects.toThrow( /Unknown GPU pool/ )

    } )

    test( `recycles existing endpoint found by deterministic name`, async () => {

        // 1. get_endpoint → 404
        fetch_mock.mockResolvedValueOnce( error_response( 404 ) )

        // 2. find_existing_endpoint → list_endpoints returns a match
        const existing = { id: `ep-recycled`, name: `gratisai-qwen-qwen3-8b-24gb`, templateId: `tpl-old` }
        fetch_mock.mockResolvedValueOnce( json_response( [ existing ] ) )

        const result = await ensure_endpoint( `key`, {
            endpoint_id: `ep-gone`,
            model_name: `Qwen/Qwen3-8B`,
            gpu_id: `24gb`,
        } )

        expect( result ).toEqual( {
            endpoint_id: `ep-recycled`,
            template_id: `tpl-old`,
            changed: true,
        } )

        // Two fetches: get_endpoint + list_endpoints
        expect( fetch_mock ).toHaveBeenCalledTimes( 2 )

    } )

    test( `creates new template + endpoint when nothing found`, async () => {

        // 1. get_endpoint → 404
        fetch_mock.mockResolvedValueOnce( error_response( 404 ) )

        // 2. find_existing_endpoint → list_endpoints returns empty
        fetch_mock.mockResolvedValueOnce( json_response( [] ) )

        // 3. create_template → GraphQL response
        fetch_mock.mockResolvedValueOnce( json_response( {
            data: { saveTemplate: { id: `tpl-new`, name: `gratisai-qwen-qwen3-8b-...` } },
        } ) )

        // 4. create_endpoint → REST response
        const pool = GPU_POOLS.find( p => p.id === `24gb` )
        fetch_mock.mockResolvedValueOnce( json_response( {
            id: `ep-new`,
            name: `gratisai-qwen-qwen3-8b-24gb`,
        } ) )

        const result = await ensure_endpoint( `key`, {
            endpoint_id: `ep-gone`,
            model_name: `Qwen/Qwen3-8B`,
            gpu_id: `24gb`,
        } )

        expect( result ).toEqual( {
            endpoint_id: `ep-new`,
            template_id: `tpl-new`,
            changed: true,
        } )

        // Four fetches: get_endpoint + list_endpoints + create_template (graphql) + create_endpoint
        expect( fetch_mock ).toHaveBeenCalledTimes( 4 )

        // Verify the endpoint was created with deterministic name + correct GPU IDs
        const create_call = fetch_mock.mock.calls[ 3 ]
        const create_body = JSON.parse( create_call[ 1 ].body )
        expect( create_body.name ).toBe( `gratisai-qwen-qwen3-8b-24gb` )
        expect( create_body.gpuTypeIds ).toEqual( pool.gpu_ids )

    } )

    test( `propagates auth errors from get_endpoint`, async () => {

        fetch_mock.mockResolvedValueOnce( error_response( 401, `Unauthorized` ) )

        await expect( ensure_endpoint( `bad-key`, {
            endpoint_id: `ep-123`,
            model_name: `Qwen/Qwen3-8B`,
            gpu_id: `24gb`,
        } ) ).rejects.toThrow( /401/ )

    } )

} )
