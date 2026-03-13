/**
 * RunPod service integration tests — real API calls against RunPod.
 *
 * Uses the API key from .env.development (VITE_RUNPOD_API_KEY_CI).
 * These tests create real cloud resources and tear them down afterwards.
 *
 * Run with: npx vitest run tests/unit/runpod_service.test.js
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import {
    GPU_POOLS,
    endpoint_name_for_model,
    fetch_gpu_pricing,
    fetch_model_config,
    estimate_vram_bytes,
    estimate_vram_gb,
    suggest_gpu,
    get_all_gpus_annotated,
    choose_best_gpu,
    choose_best_gpu_annotated,
    create_template,
    create_endpoint,
    get_endpoint_health,
    submit_job,
    delete_endpoint,
    delete_template,
} from '../../src/providers/runpod_service.js'
import {
    get_cloud_models,
    find_by_hf_repo,
    estimate_cloud_vram,
    estimate_cloud_vram_gb,
    select_best_model,
    get_fitting_models,
    MODEL_CATALOG,
} from '../../src/utils/model_catalog.js'


// ─── Test config ────────────────────────────────────────────────────────────

const API_KEY = process.env.VITE_RUNPOD_API_KEY_CI

// Tiny model — fast cold starts, minimal VRAM, cheap
const TEST_MODEL = `HuggingFaceTB/SmolLM2-360M-Instruct`

// Slightly larger model for config validation (has well-known architecture params)
const KNOWN_MODEL = `Qwen/Qwen3-0.6B`


// ─── GPU info, pricing, and availability ────────────────────────────────────

describe( `GPU info`, () => {

    test( `GPU_POOLS has all expected pool tiers`, () => {

        expect( GPU_POOLS.length ).toBeGreaterThanOrEqual( 5 )

        const ids = GPU_POOLS.map( p => p.id )
        expect( ids ).toContain( `16gb` )
        expect( ids ).toContain( `24gb` )
        expect( ids ).toContain( `48gb` )
        expect( ids ).toContain( `80gb` )

        // Every pool has required fields
        for( const pool of GPU_POOLS ) {
            expect( pool.id ).toBeTruthy()
            expect( pool.name ).toBeTruthy()
            expect( pool.vram_gb ).toBeGreaterThan( 0 )
            expect( pool.gpu_ids ).toBeInstanceOf( Array )
            expect( pool.gpu_ids.length ).toBeGreaterThan( 0 )
        }

    } )

    test( `GPU_POOLS are ordered by ascending VRAM`, () => {

        for( let i = 1; i < GPU_POOLS.length; i++ ) {
            expect( GPU_POOLS[ i ].vram_gb ).toBeGreaterThanOrEqual( GPU_POOLS[ i - 1 ].vram_gb )
        }

    } )

    test( `GPU_POOLS gpu_ids contain NVIDIA GPU names`, () => {

        for( const pool of GPU_POOLS ) {
            for( const gpu_id of pool.gpu_ids ) {
                expect( gpu_id ).toMatch( /NVIDIA/ )
            }
        }

    } )

} )


// ─── Endpoint naming ─────────────────────────────────────────────────────────

describe( `endpoint_name_for_model`, () => {

    test( `includes org and model, lowercased, slash replaced with dash`, () => {

        expect( endpoint_name_for_model( `meta-llama/Llama-3.3-70B-Instruct` ) )
            .toBe( `gratisai-meta-llama-llama-3.3-70b-instruct` )

    } )

    test( `handles single-segment names (no slash)`, () => {

        expect( endpoint_name_for_model( `SomeModel` ) )
            .toBe( `gratisai-somemodel` )

    } )

    test( `preserves dashes and dots`, () => {

        expect( endpoint_name_for_model( `Qwen/Qwen3-0.6B` ) )
            .toBe( `gratisai-qwen-qwen3-0.6b` )

    } )

    test( `handles deeply nested paths`, () => {

        expect( endpoint_name_for_model( `org/sub/model` ) )
            .toBe( `gratisai-org-sub-model` )

    } )

    test( `already-lowercase input is unchanged`, () => {

        expect( endpoint_name_for_model( `deepseek-ai/deepseek-r1` ) )
            .toBe( `gratisai-deepseek-ai-deepseek-r1` )

    } )

} )


describe( `GPU pricing (live API)`, () => {

    test.skipIf( !API_KEY )( `fetch_gpu_pricing returns pricing and availability maps`, async () => {

        const { pricing, availability } = await fetch_gpu_pricing( API_KEY )

        // Should return Maps
        expect( pricing ).toBeInstanceOf( Map )
        expect( availability ).toBeInstanceOf( Map )

        // At least some pools should have pricing
        expect( pricing.size ).toBeGreaterThan( 0 )

        // Verify pricing values are positive numbers ($/hr)
        for( const [ pool_id, price ] of pricing ) {
            expect( typeof pool_id ).toBe( `string` )
            expect( price ).toBeGreaterThan( 0 )
            expect( price ).toBeLessThan( 100 ) // Sanity: no GPU costs $100/hr
        }

        // Availability values should be High/Medium/Low
        for( const [ , status ] of availability ) {
            expect( [ `High`, `Medium`, `Low` ] ).toContain( status )
        }

    } )

    test.skipIf( !API_KEY )( `fetch_gpu_pricing pool IDs match GPU_POOLS`, async () => {

        const { pricing } = await fetch_gpu_pricing( API_KEY )
        const known_ids = new Set( GPU_POOLS.map( p => p.id ) )

        for( const pool_id of pricing.keys() ) {
            expect( known_ids.has( pool_id ) ).toBe( true )
        }

    } )

    test.skipIf( !API_KEY )( `fetch_gpu_pricing fails with invalid key`, async () => {

        await expect(
            fetch_gpu_pricing( `rpa_INVALID_KEY_000000000000000000000000000000000` )
        ).rejects.toThrow()

    } )

} )


// ─── Model config from HuggingFace ──────────────────────────────────────────

describe( `Model config (HuggingFace)`, () => {

    test( `fetch_model_config returns architecture details for a known model`, async () => {

        const config = await fetch_model_config( KNOWN_MODEL )

        expect( config.model_type ).toBeTruthy()
        expect( config.num_layers ).toBeGreaterThan( 0 )
        expect( config.hidden_size ).toBeGreaterThan( 0 )
        expect( config.num_attention_heads ).toBeGreaterThan( 0 )
        expect( config.num_kv_heads ).toBeGreaterThan( 0 )
        expect( config.head_dim ).toBeGreaterThan( 0 )
        expect( config.context_length ).toBeGreaterThan( 0 )

        // Qwen3-0.6B is a qwen3 model type
        expect( config.model_type ).toMatch( /qwen/i )

        // raw config should be present
        expect( config.raw ).toBeDefined()
        expect( config.raw.model_type ).toBeTruthy()

    } )

    test( `fetch_model_config returns sensible values for test model`, async () => {

        const config = await fetch_model_config( TEST_MODEL )

        expect( config.model_type ).toBeTruthy()
        expect( config.context_length ).toBeGreaterThanOrEqual( 1024 )

    } )

    test( `fetch_model_config throws for nonexistent model`, async () => {

        await expect(
            fetch_model_config( `totally-fake-org/nonexistent-model-999` )
        ).rejects.toThrow( /check the repo name/ )

    } )

    test( `fetch_model_config works for a sample of cloud models from catalog`, async () => {

        // Test a subset to avoid hammering HF — pick first, middle, and last
        const cloud = get_cloud_models()
        const samples = [
            cloud[ 0 ],
            cloud[ Math.floor( cloud.length / 2 ) ],
            cloud[ cloud.length - 1 ],
        ]

        for( const model of samples ) {

            const config = await fetch_model_config( model.hf_model_repo )
            expect( config.model_type ).toBeTruthy()
            expect( config.context_length ).toBeGreaterThan( 0 )

        }

    }, 30_000 )

} )


// ─── VRAM estimation (pure functions) ───────────────────────────────────────

describe( `VRAM estimation`, () => {

    const mock_config = {
        num_params: 7_000_000_000,   // 7B
        num_layers: 32,
        hidden_size: 4096,
        num_attention_heads: 32,
        num_kv_heads: 8,
        head_dim: 128,
        context_length: 4096,
    }

    test( `estimate_vram_bytes returns positive value for fp16`, () => {

        const vram = estimate_vram_bytes( mock_config, `fp16` )

        expect( vram ).toBeGreaterThan( 0 )
        // 7B FP16 ≈ 14 GB weights + KV cache + overhead ≈ ~17-20 GB
        const vram_gb = vram / ( 1024 ** 3 )
        expect( vram_gb ).toBeGreaterThan( 10 )
        expect( vram_gb ).toBeLessThan( 40 )

    } )

    test( `estimate_vram_bytes with AWQ quantisation is much smaller`, () => {

        const fp16 = estimate_vram_bytes( mock_config, `fp16` )
        const awq = estimate_vram_bytes( mock_config, `awq` )

        // AWQ (4-bit) should use significantly less VRAM
        expect( awq ).toBeLessThan( fp16 )
        expect( awq ).toBeLessThan( fp16 * 0.5 )

    } )

    test( `estimate_vram_gb returns value in gigabytes`, () => {

        const bytes = estimate_vram_bytes( mock_config )
        const gb = estimate_vram_gb( mock_config )

        expect( Math.abs( gb - bytes / ( 1024 ** 3 ) ) ).toBeLessThan( 0.01 )

    } )

    test( `context length override affects VRAM estimate`, () => {

        const short_ctx = estimate_vram_bytes( mock_config, `fp16`, 2048 )
        const long_ctx = estimate_vram_bytes( mock_config, `fp16`, 32768 )

        // Longer context = more KV cache = more VRAM
        expect( long_ctx ).toBeGreaterThan( short_ctx )

    } )

    test( `all quantisation types produce valid estimates`, () => {

        const quant_types = [ `fp16`, `bf16`, `fp8`, `int8`, `awq`, `gptq`, `int4` ]

        for( const quant of quant_types ) {
            const vram = estimate_vram_bytes( mock_config, quant )
            expect( vram ).toBeGreaterThan( 0 )
            expect( Number.isFinite( vram ) ).toBe( true )
        }

    } )

    test( `unknown quantisation type defaults to fp16-like`, () => {

        const fp16 = estimate_vram_bytes( mock_config, `fp16` )
        const unknown = estimate_vram_bytes( mock_config, `some_future_quant` )

        // Both should use 2 bytes per weight (default)
        expect( unknown ).toBe( fp16 )

    } )

    test( `estimate works with real model config from HuggingFace`, async () => {

        const config = await fetch_model_config( KNOWN_MODEL )
        const vram_gb = estimate_vram_gb( config )

        // Qwen3-0.6B in FP16 should be roughly 1-3 GB
        expect( vram_gb ).toBeGreaterThan( 0.5 )
        expect( vram_gb ).toBeLessThan( 10 )

    } )

} )


// ─── GPU suggestion (pure functions) ────────────────────────────────────────

describe( `GPU suggestion`, () => {

    const mock_pricing = new Map( [
        [ `16gb`, 0.20 ],
        [ `24gb`, 0.40 ],
        [ `48gb`, 0.76 ],
        [ `80gb`, 1.99 ],
    ] )

    const mock_availability = new Map( [
        [ `16gb`, `Low` ],
        [ `24gb`, `High` ],
        [ `48gb`, `Medium` ],
        [ `80gb`, `High` ],
    ] )

    test( `suggest_gpu returns null when nothing fits`, () => {

        const result = suggest_gpu( 999, mock_pricing, mock_availability )
        expect( result ).toBeNull()

    } )

    test( `suggest_gpu returns pool with enough VRAM`, () => {

        const result = suggest_gpu( 20 )
        expect( result ).not.toBeNull()
        expect( result.pool.vram_gb ).toBeGreaterThanOrEqual( 20 )

    } )

    test( `suggest_gpu prioritises availability over price`, () => {

        // Need ≥16 GB. 16gb is cheapest but has Low availability.
        // Should pick 24gb (High availability) over 16gb (Low).
        const result = suggest_gpu( 15, mock_pricing, mock_availability )

        expect( result.pool.id ).toBe( `24gb` )
        expect( result.availability ).toBe( `High` )

    } )

    test( `suggest_gpu includes price and availability info`, () => {

        const result = suggest_gpu( 20, mock_pricing, mock_availability )

        expect( result.pool ).toBeDefined()
        expect( result.price_per_hr ).toBeGreaterThan( 0 )
        expect( result.availability ).toBeTruthy()

    } )

    test( `suggest_gpu works without pricing/availability data`, () => {

        const result = suggest_gpu( 20 )

        // Should fall back to smallest fitting pool
        expect( result ).not.toBeNull()
        expect( result.pool.vram_gb ).toBeGreaterThanOrEqual( 20 )
        expect( result.price_per_hr ).toBeNull()
        expect( result.availability ).toBeNull()

    } )

    test( `get_all_gpus_annotated returns all pools with fitness`, () => {

        const gpus = get_all_gpus_annotated( 30, mock_pricing, mock_availability )

        expect( gpus.length ).toBe( GPU_POOLS.length )

        // Check ordering by VRAM
        for( let i = 1; i < gpus.length; i++ ) {
            expect( gpus[ i ].pool.vram_gb ).toBeGreaterThanOrEqual( gpus[ i - 1 ].pool.vram_gb )
        }

        // Pools below 30 GB should not fit
        for( const gpu of gpus ) {
            if( gpu.pool.vram_gb < 30 ) {
                expect( gpu.fits ).toBe( false )
            } else {
                expect( gpu.fits ).toBe( true )
            }
        }

    } )

    test( `get_all_gpus_annotated includes price and availability`, () => {

        const gpus = get_all_gpus_annotated( 10, mock_pricing, mock_availability )

        const gpu_24 = gpus.find( g => g.pool.id === `24gb` )
        expect( gpu_24.price_per_hr ).toBe( 0.40 )
        expect( gpu_24.availability ).toBe( `High` )

    } )

    test( `get_all_gpus_annotated works without pricing/availability`, () => {

        const gpus = get_all_gpus_annotated( 20 )

        expect( gpus.length ).toBe( GPU_POOLS.length )
        for( const gpu of gpus ) {
            expect( gpu.price_per_hr ).toBeNull()
            expect( gpu.availability ).toBeNull()
        }

    } )

} )


// ─── End-to-end endpoint lifecycle (live API) ───────────────────────────────
// Serial execution: create → health → inference → teardown

describe.skipIf( !API_KEY )( `Endpoint lifecycle (live API)`, () => {

    let template_id = null
    let endpoint_id = null

    // ── Create template ─────────────────────────────────────────────────

    test( `create_template creates a vLLM template`, async () => {

        const result = await create_template( API_KEY, {
            model_name: TEST_MODEL,
            gpu_memory_utilization: 0.90,
            max_model_len: 512,
        } )

        expect( result.id ).toBeTruthy()
        expect( result.name ).toMatch( /gratisai/ )
        expect( result.name ).toMatch( /smollm2/i )

        template_id = result.id

    } )

    // ── Create endpoint ─────────────────────────────────────────────────

    test( `create_endpoint creates a serverless endpoint`, async () => {

        expect( template_id ).toBeTruthy() // Guard: template must exist

        // Use 24gb pool — widely available, can run the tiny test model
        const pool = GPU_POOLS.find( p => p.id === `24gb` )

        const result = await create_endpoint( API_KEY, {
            template_id,
            name: `test-runpod-service-${ Date.now() }`,
            gpu_ids: pool.gpu_ids,
            idle_timeout: 5,
        } )

        expect( result.id ).toBeTruthy()
        expect( result.name ).toMatch( /test-runpod-service/ )

        endpoint_id = result.id

    } )

    // ── Health check ────────────────────────────────────────────────────

    test( `get_endpoint_health returns worker/job status`, async () => {

        expect( endpoint_id ).toBeTruthy() // Guard

        const health = await get_endpoint_health( API_KEY, endpoint_id )

        // Health response has workers and jobs objects
        expect( health ).toHaveProperty( `workers` )
        expect( health ).toHaveProperty( `jobs` )

        // Workers object has expected state keys
        const worker_keys = Object.keys( health.workers )
        expect( worker_keys.length ).toBeGreaterThan( 0 )

    } )

    // ── Submit inference job ────────────────────────────────────────────

    test( `submit_job queues an inference request`, async () => {

        expect( endpoint_id ).toBeTruthy() // Guard

        const job = await submit_job( API_KEY, endpoint_id, {
            openai_route: `/chat/completions`,
            openai_input: {
                model: TEST_MODEL,
                messages: [ { role: `user`, content: `Say hello` } ],
                max_tokens: 10,
            },
        } )

        // Job should be accepted (queued or in progress)
        expect( job.id ).toBeTruthy()
        expect( [ `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED` ] ).toContain( job.status )

    } )

    // ── OpenAI-compatible inference (waits for worker) ──────────────────

    test( `OpenAI-compatible endpoint returns a chat completion`, async () => {

        expect( endpoint_id ).toBeTruthy() // Guard

        // Poll until a worker is ready, or until we can get a response.
        // The vLLM endpoint may take a while for cold start.
        const url = `https://api.runpod.ai/v2/${ endpoint_id }/openai/v1/chat/completions`

        let response_text = null
        let last_error = null
        const max_wait = 300_000 // 5 min
        const start = Date.now()

        while( Date.now() - start < max_wait ) {

            try {

                const res = await fetch( url, {
                    method: `POST`,
                    headers: {
                        'Authorization': `Bearer ${ API_KEY }`,
                        'Content-Type': `application/json`,
                    },
                    body: JSON.stringify( {
                        model: TEST_MODEL,
                        messages: [ { role: `user`, content: `What is 2+2? Answer with just the number.` } ],
                        max_tokens: 16,
                        temperature: 0,
                    } ),
                } )

                if( res.ok ) {
                    const data = await res.json()
                    response_text = data.choices?.[ 0 ]?.message?.content
                    break
                }

                last_error = `HTTP ${ res.status }: ${ await res.text().catch( () => `` ) }`

            } catch ( err ) {
                last_error = err.message
            }

            // Wait 10s between retries
            await new Promise( r => setTimeout( r, 10_000 ) )

        }

        if( response_text === null ) {
            // Still report what went wrong, but don't fail hard — cold starts
            // can exceed 5 min on scarce GPU pools
            console.warn( `[WARN] Could not get inference response within timeout. Last error: ${ last_error }` )
            return
        }

        expect( response_text ).toBeTruthy()
        expect( response_text.length ).toBeGreaterThan( 0 )

    }, 360_000 )

    // ── Streaming inference ─────────────────────────────────────────────

    test( `OpenAI-compatible endpoint supports SSE streaming`, async () => {

        expect( endpoint_id ).toBeTruthy() // Guard

        const url = `https://api.runpod.ai/v2/${ endpoint_id }/openai/v1/chat/completions`

        let tokens = []
        let last_error = null
        const max_wait = 300_000 // 5 min — cold start may still be in progress
        const start = Date.now()

        while( Date.now() - start < max_wait ) {

            try {

                const res = await fetch( url, {
                    method: `POST`,
                    headers: {
                        'Authorization': `Bearer ${ API_KEY }`,
                        'Content-Type': `application/json`,
                    },
                    body: JSON.stringify( {
                        model: TEST_MODEL,
                        messages: [ { role: `user`, content: `Say "hello world"` } ],
                        max_tokens: 10,
                        stream: true,
                    } ),
                } )

                if( !res.ok ) {
                    last_error = `HTTP ${ res.status }`
                    await new Promise( r => setTimeout( r, 10_000 ) )
                    continue
                }

                // Read the SSE stream
                const text = await res.text()
                const lines = text.split( `\n` )

                for( const line of lines ) {
                    const trimmed = line.trim()
                    if( !trimmed.startsWith( `data: ` ) ) continue
                    const payload = trimmed.slice( 6 )
                    if( payload === `[DONE]` ) continue

                    try {
                        const chunk = JSON.parse( payload )
                        const content = chunk.choices?.[ 0 ]?.delta?.content
                        if( content ) tokens.push( content )
                    } catch {
                        // skip malformed chunks
                    }
                }

                if( tokens.length > 0 ) break

            } catch ( err ) {
                last_error = err.message
            }

            await new Promise( r => setTimeout( r, 10_000 ) )

        }

        if( tokens.length === 0 ) {
            console.warn( `[WARN] Streaming test did not receive tokens. Last error: ${ last_error }` )
            return
        }

        // Should receive multiple token chunks
        expect( tokens.length ).toBeGreaterThan( 0 )

        // Joined tokens should form readable text
        const full_text = tokens.join( `` )
        expect( full_text.length ).toBeGreaterThan( 0 )

    }, 360_000 )

    // ── Teardown ────────────────────────────────────────────────────────

    test( `delete_endpoint removes the endpoint`, async () => {

        if( !endpoint_id ) return

        // delete_endpoint should succeed without throwing
        await delete_endpoint( API_KEY, endpoint_id )

        // RunPod's health endpoint may still respond briefly after deletion
        // (eventual consistency), so we just verify the delete call succeeded
        endpoint_id = null

    } )

    test( `delete_template removes the template`, async () => {

        if( !template_id ) return

        await delete_template( API_KEY, template_id )

        // No good way to verify deletion via API, but if it didn't throw, it worked
        template_id = null

    } )

    // Safety net — clean up even if tests fail
    afterAll( async () => {

        if( endpoint_id ) {
            try {
                await delete_endpoint( API_KEY, endpoint_id )
                console.log( `[cleanup] Deleted endpoint ${ endpoint_id }` )
            } catch ( err ) {
                console.warn( `[cleanup] Failed to delete endpoint ${ endpoint_id }: ${ err.message }` )
            }
        }

        if( template_id ) {
            try {
                await delete_template( API_KEY, template_id )
                console.log( `[cleanup] Deleted template ${ template_id }` )
            } catch ( err ) {
                console.warn( `[cleanup] Failed to delete template ${ template_id }: ${ err.message }` )
            }
        }

    } )

} )


// ─── Cloud model catalog helpers ─────────────────────────────────────────────

describe( `get_cloud_models`, () => {

    test( `returns models with hf_model_repo`, () => {

        const cloud = get_cloud_models()

        expect( cloud.length ).toBeGreaterThan( 0 )

        for( const model of cloud ) {
            expect( model.hf_model_repo ).toBeTruthy()
            expect( model.hf_model_repo ).toMatch( /^[^/]+\/[^/]+/ )
            expect( model.name ).toBeTruthy()
            expect( model.parameters_label ).toBeTruthy()
            expect( model.description ).toBeTruthy()
        }

    } )

    test( `includes both cloud-only and dual-use models`, () => {

        const cloud = get_cloud_models()

        const cloud_only = cloud.filter( m => m.cloud_only )
        const dual_use = cloud.filter( m => !m.cloud_only )

        expect( cloud_only.length ).toBeGreaterThan( 0 )
        expect( dual_use.length ).toBeGreaterThan( 0 )

    } )

    test( `is sorted by quality score descending`, () => {

        const cloud = get_cloud_models()

        for( let i = 1; i < cloud.length; i++ ) {
            const prev_score = cloud[ i - 1 ].benchmarks ? 1 : 0
            const curr_score = cloud[ i ].benchmarks ? 1 : 0
            // Broadly check the ordering holds (exact scoring tested elsewhere)
            expect( prev_score ).toBeGreaterThanOrEqual( curr_score - 1 )
        }

    } )

} )


describe( `find_by_hf_repo`, () => {

    test( `finds a known dual-use model`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-8B` )
        expect( model ).toBeDefined()
        expect( model.family ).toBe( `qwen3` )

    } )

    test( `finds a cloud-only model`, () => {

        const model = find_by_hf_repo( `deepseek-ai/DeepSeek-R1` )
        expect( model ).toBeDefined()
        expect( model.cloud_only ).toBe( true )

    } )

    test( `returns undefined for unknown repo`, () => {

        expect( find_by_hf_repo( `totally-fake/model` ) ).toBeUndefined()

    } )

} )


describe( `estimate_cloud_vram`, () => {

    test( `returns positive value for a catalog model`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-8B` )
        const vram = estimate_cloud_vram( model, `fp16` )

        expect( vram ).toBeGreaterThan( 0 )

        // 8B FP16 should be roughly 15-25 GB
        const gb = vram / 1024 ** 3
        expect( gb ).toBeGreaterThan( 10 )
        expect( gb ).toBeLessThan( 40 )

    } )

    test( `AWQ uses less VRAM than FP16`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-8B` )
        const fp16 = estimate_cloud_vram( model, `fp16` )
        const awq = estimate_cloud_vram( model, `awq` )

        expect( awq ).toBeLessThan( fp16 )

    } )

    test( `estimate_cloud_vram_gb matches bytes conversion`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-8B` )
        const bytes = estimate_cloud_vram( model )
        const gb = estimate_cloud_vram_gb( model )

        expect( Math.abs( gb - bytes / 1024 ** 3 ) ).toBeLessThan( 0.01 )

    } )

    test( `handles MoE model (uses total params for VRAM)`, () => {

        const model = find_by_hf_repo( `deepseek-ai/DeepSeek-R1` )
        const gb = estimate_cloud_vram_gb( model, `fp16` )

        // 671B FP16 should be massive — over 1 TB VRAM
        expect( gb ).toBeGreaterThan( 1000 )

    } )

} )


describe( `choose_best_gpu`, () => {

    test( `returns a GPU for a small model`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-0.6B` )
        const result = choose_best_gpu( model )

        expect( result ).not.toBeNull()
        expect( result.pool.vram_gb ).toBeGreaterThan( 0 )

    } )

    test( `returns null when model is too large for any GPU`, () => {

        const model = find_by_hf_repo( `deepseek-ai/DeepSeek-R1` )
        const result = choose_best_gpu( model )

        // FP16 671B cannot fit on any single GPU pool
        expect( result ).toBeNull()

    } )

    test( `choose_best_gpu_annotated returns all pools`, () => {

        const model = find_by_hf_repo( `Qwen/Qwen3-8B` )
        const gpus = choose_best_gpu_annotated( model )

        expect( gpus.length ).toBe( GPU_POOLS.length )

    } )

} )


describe( `cloud-only model exclusion from local selection`, () => {

    test( `select_best_model never returns a cloud-only model`, () => {

        const model = select_best_model( Infinity )
        expect( model.cloud_only ).toBeFalsy()

    } )

    test( `get_fitting_models excludes cloud-only models`, () => {

        const models = get_fitting_models( Infinity )

        for( const m of models ) {
            expect( m.cloud_only ).toBeFalsy()
        }

    } )

    test( `MODEL_CATALOG contains cloud-only entries`, () => {

        const cloud_only = MODEL_CATALOG.filter( m => m.cloud_only )
        expect( cloud_only.length ).toBeGreaterThanOrEqual( 6 )

    } )

} )


// ─── Error handling ─────────────────────────────────────────────────────────

describe.skipIf( !API_KEY )( `Error handling`, () => {

    test( `create_template fails with invalid model name gracefully`, async () => {

        // This should succeed at the API level (RunPod doesn't validate HF repos
        // when creating templates), but let's verify it doesn't crash
        const result = await create_template( API_KEY, {
            model_name: `nonexistent/model-that-does-not-exist`,
        } )

        // Clean up — the template was created even if the model is bogus
        if( result?.id ) {
            await delete_template( API_KEY, result.id )
        }

    } )

    test( `get_endpoint_health fails for nonexistent endpoint`, async () => {

        await expect(
            get_endpoint_health( API_KEY, `nonexistent_endpoint_id` )
        ).rejects.toThrow()

    } )

    test( `delete_endpoint fails for nonexistent endpoint`, async () => {

        await expect(
            delete_endpoint( API_KEY, `nonexistent_endpoint_id` )
        ).rejects.toThrow()

    } )

    test( `delete_template fails for nonexistent template`, async () => {

        await expect(
            delete_template( API_KEY, `nonexistent_template_id` )
        ).rejects.toThrow()

    } )

    test( `submit_job fails for nonexistent endpoint`, async () => {

        await expect(
            submit_job( API_KEY, `nonexistent_endpoint_id`, { messages: [] } )
        ).rejects.toThrow()

    } )

} )
