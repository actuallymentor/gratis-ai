/**
 * RunPod API client — endpoint lifecycle, GPU selection, and model validation.
 *
 * Two API surfaces:
 * - Management REST API: `https://rest.runpod.io/v1/` — create/delete templates + endpoints
 * - Serverless Job API: `https://api.runpod.ai/v2/{endpoint_id}/` — inference + health
 *
 * All endpoints use RunPod's official vLLM serverless worker image, which
 * provides an OpenAI-compatible API out of the box.
 *
 * @module runpod_service
 */
import { log } from 'mentie'
import { estimate_cloud_vram_gb } from '../utils/model_catalog'

const MANAGEMENT_BASE = `https://rest.runpod.io/v1`
const INFERENCE_BASE = `https://api.runpod.ai/v2`
const GRAPHQL_BASE = `https://api.runpod.io/graphql`
const HF_API = `https://huggingface.co`

// Official vLLM serverless worker image — pinned to a stable CUDA 12.1 release
const VLLM_IMAGE = `runpod/worker-v1-vllm:v2.4.0stable-cuda12.1.0`


// ─── Serverless GPU pools ────────────────────────────────────────────────────
// These are the pool IDs accepted by RunPod's serverless endpoint API.
// VRAM values are the minimum guaranteed by any GPU in the pool.

export const GPU_POOLS = [
    { id: `16gb`,   name: `16 GB (A4000, RTX 4000)`,   vram_gb: 16,  gpu_ids: [ `NVIDIA RTX A4000`, `NVIDIA RTX A4500`, `NVIDIA RTX 4000 Ada Generation`, `NVIDIA RTX 2000 Ada Generation` ] },
    { id: `24gb`,   name: `24 GB (4090, L4, A5000)`,   vram_gb: 24,  gpu_ids: [ `NVIDIA GeForce RTX 4090`, `NVIDIA L4`, `NVIDIA RTX A5000`, `NVIDIA GeForce RTX 3090` ] },
    { id: `48gb`,   name: `48 GB (A6000, L40S, A40)`,  vram_gb: 48,  gpu_ids: [ `NVIDIA RTX A6000`, `NVIDIA L40S`, `NVIDIA L40`, `NVIDIA A40`, `NVIDIA RTX 6000 Ada Generation` ] },
    { id: `80gb`,   name: `80 GB (A100, H100)`,        vram_gb: 80,  gpu_ids: [ `NVIDIA A100-SXM4-80GB`, `NVIDIA A100 80GB PCIe`, `NVIDIA H100 80GB HBM3`, `NVIDIA H100 PCIe` ] },
    { id: `141gb`,  name: `141 GB (H200)`,             vram_gb: 141, gpu_ids: [ `NVIDIA H200` ] },
    { id: `192gb`,  name: `192 GB (B200)`,             vram_gb: 192, gpu_ids: [ `NVIDIA B200` ] },
]


// ─── HTTP helpers ────────────────────────────────────────────────────────────

const headers = ( api_key, extra = {} ) => ( {
    'Authorization': `Bearer ${ api_key }`,
    'Content-Type': `application/json`,
    ...extra,
} )

async function api_fetch( url, api_key, opts = {} ) {

    const res = await fetch( url, {
        ...opts,
        headers: headers( api_key, opts.headers ),
    } )

    if( !res.ok ) {
        const body = await res.text().catch( () => `` )
        throw new Error( `RunPod API error (${ res.status }): ${ body || res.statusText }` )
    }

    // DELETE returns 204 No Content
    if( res.status === 204 ) return null

    return res.json()

}

async function graphql( api_key, query, variables = {} ) {

    const res = await fetch( GRAPHQL_BASE, {
        method: `POST`,
        headers: headers( api_key ),
        body: JSON.stringify( { query, variables } ),
    } )

    const data = await res.json()

    if( data.errors?.length ) {
        throw new Error( `RunPod GraphQL error: ${ data.errors[ 0 ].message }` )
    }

    return data.data

}


// ─── Endpoint naming ─────────────────────────────────────────────────────────

/**
 * Deterministic endpoint name for a model + GPU tier.
 *
 * Includes the GPU VRAM so that upgrading to a more powerful GPU creates a
 * new endpoint instead of recycling the old one.
 *
 * `meta-llama/Llama-3.3-70B-Instruct`, 80 → `gratisai-meta-llama-llama-3.3-70b-instruct-80gb`
 *
 * @param {string} model_name - HuggingFace model ID (e.g. `meta-llama/Llama-3.3-70B-Instruct`)
 * @param {number} [gpu_vram_gb] - GPU pool VRAM in GB (e.g. 24, 48, 80). Omit for legacy names without GPU suffix.
 * @returns {string}
 */
export function endpoint_name_for_model( model_name, gpu_vram_gb ) {

    const base = `gratisai-${ model_name.replace( /\//g, `-` ).toLowerCase() }`
    return gpu_vram_gb ? `${ base }-${ gpu_vram_gb }gb` : base

}


// ─── Endpoint lookup ─────────────────────────────────────────────────────────

/**
 * List all serverless endpoints on the account.
 *
 * @param {string} api_key
 * @returns {Promise<Array<{ id: string, name: string, templateId: string }>>}
 */
export async function list_endpoints( api_key ) {
    return api_fetch( `${ MANAGEMENT_BASE }/endpoints`, api_key )
}

/**
 * Find an existing endpoint whose name matches the deterministic name
 * for the given model + GPU tier. Returns the endpoint object or `null`.
 *
 * @param {string} api_key
 * @param {string} model_name - HuggingFace model ID
 * @param {number} [gpu_vram_gb] - GPU pool VRAM in GB (must match the deployed tier)
 * @returns {Promise<Object | null>}
 */
export async function find_existing_endpoint( api_key, model_name, gpu_vram_gb ) {

    const target_name = endpoint_name_for_model( model_name, gpu_vram_gb )
    const endpoints = await list_endpoints( api_key )

    // RunPod may append suffixes to the name (e.g. " -fb" for flashboot),
    // so match by prefix rather than exact equality
    return endpoints.find( ep => ep.name.startsWith( target_name ) ) || null

}


// ─── Template management ─────────────────────────────────────────────────────

/**
 * Create a vLLM serverless template for a given model.
 *
 * Templates hold the Docker image and environment config.
 * The endpoint references this template by ID.
 *
 * @param {string} api_key
 * @param {Object} opts
 * @param {string} opts.model_name - HuggingFace model ID (e.g. `meta-llama/Llama-3.3-70B-Instruct`)
 * @param {string} [opts.quantization] - vLLM quantization method (awq, gptq, etc.)
 * @param {number} [opts.max_model_len] - Override max context length
 * @param {number} [opts.gpu_memory_utilization] - VRAM fraction (default 0.95)
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function create_template( api_key, { model_name, quantization, max_model_len, gpu_memory_utilization = 0.95 } ) {

    const env_map = {
        MODEL_NAME: model_name,
        GPU_MEMORY_UTILIZATION: String( gpu_memory_utilization ),
        RAW_OPENAI_OUTPUT: `1`,
        TRUST_REMOTE_CODE: `false`,
    }

    if( quantization ) env_map.QUANTIZATION = quantization
    if( max_model_len ) env_map.MAX_MODEL_LEN = String( max_model_len )

    // GraphQL expects env as [{key, value}] array
    const env = Object.entries( env_map ).map( ( [ key, value ] ) => ( { key, value } ) )

    const template_name = `gratisai-${ model_name.replace( /\//g, `-` ).toLowerCase() }-${ Date.now() }`

    // Use GraphQL API — the REST API has a bug where it rejects `isServerless: true`
    // templates due to a `volumeInGb` default conflict (as of 2026-03)
    const data = await graphql( api_key, `
        mutation CreateTemplate( $input: SaveTemplateInput! ) {
            saveTemplate( input: $input ) { id name }
        }
    `, {
        input: {
            name: template_name,
            imageName: VLLM_IMAGE,
            isServerless: true,
            volumeInGb: 0,
            containerDiskInGb: 20,
            dockerArgs: ``,
            env,
        },
    } )

    const result = data.saveTemplate
    log.info( `[runpod] Created template ${ result.id } for ${ model_name }` )
    return result

}


// ─── Endpoint CRUD ───────────────────────────────────────────────────────────

/**
 * Create a serverless endpoint backed by a vLLM template.
 *
 * @param {string} api_key
 * @param {Object} opts
 * @param {string} opts.template_id - Template ID from create_template()
 * @param {string} opts.name - Human-readable endpoint name
 * @param {string[]} opts.gpu_ids - GPU type names (e.g. `['NVIDIA GeForce RTX 4090', 'NVIDIA L4']`)
 * @param {number} [opts.idle_timeout] - Minutes before scaling to zero (default 5)
 * @param {number} [opts.max_workers] - Maximum concurrent workers (default 5)
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function create_endpoint( api_key, { template_id, name, gpu_ids, idle_timeout = 5, max_workers = 5 } ) {

    const result = await api_fetch( `${ MANAGEMENT_BASE }/endpoints`, api_key, {
        method: `POST`,
        body: JSON.stringify( {
            templateId: template_id,
            name,
            gpuTypeIds: gpu_ids,
            workersMin: 0,
            workersMax: max_workers,
            idleTimeout: idle_timeout * 60,
            scalerType: `QUEUE_DELAY`,
            scalerValue: 4,
        } ),
    } )

    log.info( `[runpod] Created endpoint ${ result.id } (${ name }) on ${ gpu_ids.join( `, ` ) }` )
    return result

}

/**
 * Delete a serverless endpoint.
 * @param {string} api_key
 * @param {string} endpoint_id
 */
export async function delete_endpoint( api_key, endpoint_id ) {
    await api_fetch( `${ MANAGEMENT_BASE }/endpoints/${ endpoint_id }`, api_key, {
        method: `DELETE`,
    } )
    log.info( `[runpod] Deleted endpoint ${ endpoint_id }` )
}

/**
 * Delete a template.
 * @param {string} api_key
 * @param {string} template_id
 */
export async function delete_template( api_key, template_id ) {
    await api_fetch( `${ MANAGEMENT_BASE }/templates/${ template_id }`, api_key, {
        method: `DELETE`,
    } )
    log.info( `[runpod] Deleted template ${ template_id }` )
}

/**
 * Get endpoint health (worker status and job counts).
 *
 * Worker states: idle, initializing, ready, running, throttled, unhealthy.
 *
 * @param {string} api_key
 * @param {string} endpoint_id
 * @returns {Promise<{ workers: Object, jobs: Object }>}
 */
export async function get_endpoint_health( api_key, endpoint_id ) {
    return api_fetch( `${ INFERENCE_BASE }/${ endpoint_id }/health`, api_key )
}

/**
 * Submit an async job to a serverless endpoint.
 *
 * The job enters the queue immediately — even if no worker is available yet,
 * the queue entry triggers RunPod to spin one up.
 *
 * @param {string} api_key
 * @param {string} endpoint_id
 * @param {Object} input - Worker-specific payload (e.g. OpenAI chat body for vLLM)
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function submit_job( api_key, endpoint_id, input ) {
    return api_fetch( `${ INFERENCE_BASE }/${ endpoint_id }/run`, api_key, {
        method: `POST`,
        body: JSON.stringify( { input } ),
    } )
}


// ─── GPU pricing & availability (live from API) ─────────────────────────────

// Availability tiers — higher number = better availability
const AVAILABILITY_RANK = { High: 3, Medium: 2, Low: 1 }

/**
 * Pick the best stock status from an array of statuses.
 * "High" beats "Medium" beats "Low" beats null.
 */
const best_stock_status = ( statuses ) =>
    statuses.reduce( ( best, s ) =>
        s && ( AVAILABILITY_RANK[ s ] || 0 ) > ( AVAILABILITY_RANK[ best ] || 0 ) ? s : best
    , null )


/**
 * Fetch current GPU pricing and availability from RunPod's GraphQL API.
 *
 * Returns both pricing and availability mapped to our serverless pool IDs.
 * A pool's availability is the best status among any of its GPUs — because
 * the endpoint accepts multiple GPU types and only needs one to be available.
 *
 * @param {string} api_key
 * @returns {Promise<{ pricing: Map<string, number>, availability: Map<string, string> }>}
 */
export async function fetch_gpu_pricing( api_key ) {

    const data = await graphql( api_key, `
        query GpuTypes {
            gpuTypes {
                id
                displayName
                memoryInGb
                secureCloud
                communityCloud
                lowestPrice( input: { gpuCount: 1 } ) {
                    minimumBidPrice
                    uninterruptablePrice
                    stockStatus
                }
            }
        }
    ` )

    const pricing = new Map()
    const availability = new Map()

    for( const pool of GPU_POOLS ) {

        // Match GPUs by the exact type names in our pool definition
        const matching = pool.gpu_ids
            .map( id => data.gpuTypes.find( g => g.id === id ) )
            .filter( Boolean )

        // Pricing — lowest on-demand price among pool GPUs
        const prices = matching
            .map( g => g.lowestPrice?.uninterruptablePrice )
            .filter( p => p != null && p > 0 )

        if( prices.length > 0 ) {
            pricing.set( pool.id, Math.min( ...prices ) )
        }

        // Availability — best stock status among pool GPUs
        const statuses = matching
            .map( g => g.lowestPrice?.stockStatus )
            .filter( Boolean )

        const best = best_stock_status( statuses )
        if( best ) availability.set( pool.id, best )

    }

    return { pricing, availability }

}


// ─── Model validation ────────────────────────────────────────────────────────

/**
 * Fetch a model's config.json from HuggingFace to get architecture details.
 *
 * @param {string} model_name - HF repo ID (e.g. `meta-llama/Llama-3.3-70B-Instruct`)
 * @returns {Promise<Object>} Parsed config.json with computed fields
 */
export async function fetch_model_config( model_name ) {

    const url = `${ HF_API }/${ model_name }/resolve/main/config.json`
    const res = await fetch( url )

    if( !res.ok ) {
        throw new Error( `Could not fetch model config for ${ model_name } — check the repo name` )
    }

    const config = await res.json()

    // Extract architecture parameters with sensible fallbacks
    const num_params = config.num_parameters
        || config.n_params
        || null

    const num_layers = config.num_hidden_layers
        || config.n_layer
        || config.num_layers
        || 0

    const hidden_size = config.hidden_size
        || config.d_model
        || config.n_embd
        || 0

    const num_attention_heads = config.num_attention_heads
        || config.n_head
        || 0

    const num_kv_heads = config.num_key_value_heads
        || config.n_head_kv
        || num_attention_heads

    const head_dim = config.head_dim
        || ( hidden_size && num_attention_heads ? Math.floor( hidden_size / num_attention_heads ) : 0 )

    const context_length = config.max_position_embeddings
        || config.max_seq_len
        || config.n_positions
        || 4096

    return {
        raw: config,
        num_params,
        num_layers,
        hidden_size,
        num_attention_heads,
        num_kv_heads,
        head_dim,
        context_length,
        model_type: config.model_type || `unknown`,
    }

}


// ─── VRAM estimation ─────────────────────────────────────────────────────────

// Bytes per weight for common quantization types
const QUANT_BYTES = {
    fp16:  2,
    bf16:  2,
    fp8:   1,
    int8:  1,
    awq:   0.5,
    gptq:  0.5,
    int4:  0.5,
}

/**
 * Estimate total GPU VRAM needed to serve a model with vLLM.
 *
 * Components:
 *   1. Model weights: parameters × bytes_per_weight
 *   2. KV cache: 2 × layers × kv_heads × head_dim × context × 2 bytes (FP16)
 *   3. Overhead: +20% for activations, CUDA kernels, vLLM page tables
 *
 * @param {Object} model_config - Output of fetch_model_config()
 * @param {string} [quantization='fp16'] - Weight quantization type
 * @param {number} [context_length] - Override context (defaults to model's native)
 * @returns {number} Estimated VRAM in bytes
 */
export function estimate_vram_bytes( model_config, quantization = `fp16`, context_length ) {

    const ctx = context_length || model_config.context_length || 4096

    // 1. Model weights
    const bytes_per_weight = QUANT_BYTES[ quantization.toLowerCase() ] || 2
    const param_count = model_config.num_params || 0

    // If we don't know param count, estimate from layers × hidden_size
    const estimated_params = param_count
        || model_config.num_layers * model_config.hidden_size * model_config.hidden_size * 4

    const weight_bytes = estimated_params * bytes_per_weight

    // 2. KV cache (FP16 by default in vLLM)
    const kv_cache = 2 * model_config.num_layers * model_config.num_kv_heads * model_config.head_dim * ctx * 2

    // 3. Total with 20% overhead
    const total = ( weight_bytes + kv_cache ) * 1.2

    return Math.ceil( total )

}

/**
 * Estimate VRAM in GB (convenience wrapper).
 * @param {Object} model_config
 * @param {string} [quantization]
 * @param {number} [context_length]
 * @returns {number} VRAM in GB
 */
export function estimate_vram_gb( model_config, quantization, context_length ) {
    return estimate_vram_bytes( model_config, quantization, context_length ) /  1024 ** 3 
}

/**
 * Suggest the best GPU pool that has enough VRAM.
 *
 * Prioritises availability over price — a cheap GPU that takes ten minutes
 * to spin up is worse than a slightly pricier one that's ready now.
 * Never auto-selects a pool where availability is "Low" or unknown.
 *
 * @param {number} vram_needed_gb - Required VRAM in GB
 * @param {Map<string, number>} [pricing] - Pool ID → $/hr (from fetch_gpu_pricing)
 * @param {Map<string, string>} [availability] - Pool ID → stockStatus
 * @returns {{ pool: Object, price_per_hr: number | null, availability: string | null } | null}
 */
export function suggest_gpu( vram_needed_gb, pricing, availability ) {

    // Filter pools with enough VRAM
    const candidates = GPU_POOLS
        .filter( p => p.vram_gb >= vram_needed_gb )
        .sort( ( a, b ) => {

            // Primary sort: availability tier (High > Medium > Low)
            if( availability ) {
                const a_rank = AVAILABILITY_RANK[ availability.get( a.id ) ] || 0
                const b_rank = AVAILABILITY_RANK[ availability.get( b.id ) ] || 0
                if( a_rank !== b_rank ) return b_rank - a_rank
            }

            // Secondary sort: price (if available)
            if( pricing ) {
                const a_price = pricing.get( a.id ) ?? Infinity
                const b_price = pricing.get( b.id ) ?? Infinity
                if( a_price !== b_price ) return a_price - b_price
            }

            // Fallback: sort by VRAM (smaller = cheaper assumption)
            return a.vram_gb - b.vram_gb

        } )

    if( candidates.length === 0 ) return null

    // Never auto-select a pool with Low or unknown availability
    const best = availability
        ? candidates.find( p => ( AVAILABILITY_RANK[ availability.get( p.id ) ] || 0 ) >= 2 ) || candidates[ 0 ]
        : candidates[ 0 ]

    const stock = availability?.get( best.id ) || null

    return {
        pool: best,
        price_per_hr: pricing?.get( best.id ) ?? null,
        availability: stock,
    }

}

/**
 * Get all GPU pools annotated with pricing, availability, and fitness.
 *
 * @param {number} vram_needed_gb
 * @param {Map<string, number>} [pricing]
 * @param {Map<string, string>} [availability]
 * @returns {Array<{ pool: Object, price_per_hr: number | null, fits: boolean, availability: string | null }>}
 */
export function get_all_gpus_annotated( vram_needed_gb, pricing, availability ) {

    return GPU_POOLS.map( pool => ( {
        pool,
        price_per_hr: pricing?.get( pool.id ) ?? null,
        fits: pool.vram_gb >= vram_needed_gb,
        availability: availability?.get( pool.id ) ?? null,
    } ) ).sort( ( a, b ) => a.pool.vram_gb - b.pool.vram_gb )

}


// ─── Catalog-aware GPU selection ─────────────────────────────────────────────

/**
 * Choose the best GPU for a catalog model — bridges catalog VRAM estimation
 * with the GPU suggestion engine.
 *
 * @param {import('../utils/model_catalog').ModelDefinition} model - Catalog model
 * @param {Object} [opts]
 * @param {string} [opts.quantization] - vLLM quantization method
 * @param {number} [opts.context_length] - Override context length
 * @param {Map<string, number>} [opts.pricing] - Pool pricing
 * @param {Map<string, string>} [opts.availability] - Pool availability
 * @returns {{ pool: Object, price_per_hr: number | null, availability: string | null } | null}
 */
export function choose_best_gpu( model, { quantization, context_length, pricing, availability } = {} ) {

    const vram_gb = estimate_cloud_vram_gb( model, quantization, context_length )
    return suggest_gpu( vram_gb, pricing, availability )

}

/**
 * Get all GPUs annotated for a catalog model — convenience bridge.
 *
 * @param {import('../utils/model_catalog').ModelDefinition} model
 * @param {Object} [opts]
 * @param {string} [opts.quantization]
 * @param {number} [opts.context_length]
 * @param {Map<string, number>} [opts.pricing]
 * @param {Map<string, string>} [opts.availability]
 * @returns {Array<{ pool: Object, price_per_hr: number | null, fits: boolean, availability: string | null }>}
 */
export function choose_best_gpu_annotated( model, { quantization, context_length, pricing, availability } = {} ) {

    const vram_gb = estimate_cloud_vram_gb( model, quantization, context_length )
    return get_all_gpus_annotated( vram_gb, pricing, availability )

}
