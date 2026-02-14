/**
 * @typedef {Object} DeviceCapabilities
 * @property {Object} gpu
 * @property {boolean} gpu.available
 * @property {boolean} gpu.webgpu - True if WebGPU API is available
 * @property {boolean} gpu.webgl - True if WebGL2 is available
 * @property {string} gpu.renderer - GPU name from WebGL debug info
 * @property {string} gpu.vendor - GPU vendor
 * @property {number} gpu.estimated_vram - Estimated VRAM in GB (heuristic)
 * @property {Object} memory
 * @property {number|null} memory.device_memory - navigator.deviceMemory (GB), null if unavailable
 * @property {number|null} memory.js_heap_limit - performance.memory?.jsHeapSizeLimit (Chrome only)
 * @property {Object} cpu
 * @property {number} cpu.cores - navigator.hardwareConcurrency
 * @property {'browser' | 'electron'} runtime
 */

/**
 * Probes WebGPU for GPU info and VRAM heuristic
 * @returns {Promise<Object>} GPU capability data
 */
const detect_webgpu = async () => {

    try {

        if( !navigator.gpu ) return { webgpu: false }

        const adapter = await navigator.gpu.requestAdapter()
        if( !adapter ) return { webgpu: false }

        const info = adapter.info || {}
        const max_buffer = adapter.limits?.maxBufferSize || 0

        // Estimate VRAM from maxBufferSize — typically 25-50% of actual VRAM
        const estimated_vram_gb = max_buffer > 0
            ? Math.round(  max_buffer /  1024 ** 3   * 2 * 10 ) / 10
            : 0

        return {
            webgpu: true,
            renderer: info.device || info.description || `Unknown GPU`,
            vendor: info.vendor || `Unknown`,
            estimated_vram: estimated_vram_gb,
        }

    } catch {
        return { webgpu: false }
    }

}

/**
 * Probes WebGL2 for GPU info as fallback
 * @returns {Object} WebGL GPU data
 */
const detect_webgl = () => {

    try {

        const canvas = document.createElement( `canvas` )
        const gl = canvas.getContext( `webgl2` ) || canvas.getContext( `webgl` )
        if( !gl ) return { webgl: false }

        const debug_info = gl.getExtension( `WEBGL_debug_renderer_info` )
        const renderer = debug_info
            ? gl.getParameter( debug_info.UNMASKED_RENDERER_WEBGL )
            : `Unknown`
        const vendor = debug_info
            ? gl.getParameter( debug_info.UNMASKED_VENDOR_WEBGL )
            : `Unknown`

        return { webgl: true, renderer, vendor }

    } catch {
        return { webgl: false }
    }

}

/**
 * Estimates VRAM from known GPU names
 * @param {string} renderer - GPU renderer string
 * @returns {number} Estimated VRAM in GB
 */
const estimate_vram_from_name = ( renderer ) => {

    if( !renderer ) return 2

    const name = renderer.toLowerCase()

    // Common discrete GPUs with known VRAM
    const known_gpus = [
        { pattern: /rtx\s*40[89]0/, vram: 16 },
        { pattern: /rtx\s*4070/, vram: 12 },
        { pattern: /rtx\s*4060/, vram: 8 },
        { pattern: /rtx\s*30[89]0/, vram: 10 },
        { pattern: /rtx\s*3070/, vram: 8 },
        { pattern: /rtx\s*3060/, vram: 12 },
        { pattern: /rtx\s*20[78]0/, vram: 8 },
        { pattern: /rx\s*7900/, vram: 20 },
        { pattern: /rx\s*7800/, vram: 16 },
        { pattern: /rx\s*6[89]00/, vram: 16 },
        { pattern: /m[1234]\s*(pro|max|ultra)/, vram: 16 },
        { pattern: /apple\s*m/, vram: 8 },
    ]

    for( const { pattern, vram } of known_gpus ) {
        if( pattern.test( name ) ) return vram
    }

    // Integrated GPUs get a low estimate
    if( name.includes( `intel` ) || name.includes( `iris` ) ) return 2
    if( name.includes( `adreno` ) || name.includes( `mali` ) ) return 1

    return 4

}

/**
 * Detects device capabilities for model tier recommendation
 * @returns {Promise<DeviceCapabilities>}
 */
export const detect_capabilities = async () => {

    // Detect runtime
    const runtime = typeof window !== `undefined` && window.electronAPI?.native_inference
        ? `electron`
        : `browser`

    // Probe GPU capabilities
    const webgpu_info = await detect_webgpu()
    const webgl_info = detect_webgl()

    // Merge GPU info, preferring WebGPU
    const gpu_available = webgpu_info.webgpu || webgl_info.webgl
    const renderer = webgpu_info.renderer || webgl_info.renderer || `Unknown`
    const vendor = webgpu_info.vendor || webgl_info.vendor || `Unknown`

    // Estimate VRAM using WebGPU data, or fall back to name lookup
    const estimated_vram = webgpu_info.estimated_vram || estimate_vram_from_name( renderer )

    // Memory detection
    const device_memory = navigator.deviceMemory || null
    const js_heap_limit = performance?.memory?.jsHeapSizeLimit || null

    // CPU info
    const cores = navigator.hardwareConcurrency || 4

    return {
        gpu: {
            available: gpu_available,
            webgpu: webgpu_info.webgpu || false,
            webgl: webgl_info.webgl || false,
            renderer,
            vendor,
            estimated_vram,
        },
        memory: {
            device_memory,
            js_heap_limit,
        },
        cpu: {
            cores,
        },
        runtime,
    }

}

/**
 * Recommends a model tier based on device capabilities
 * @param {DeviceCapabilities} capabilities
 * @returns {'lightweight' | 'medium' | 'heavy' | 'ultra'}
 */
export const get_recommended_tier = ( capabilities ) => {

    const { gpu, memory } = capabilities
    const vram = gpu.estimated_vram

    if( vram >= 16 ) return `ultra`
    if( vram >= 8 ) return `heavy`
    if( vram >= 4 ||  memory.device_memory && memory.device_memory >= 8  ) return `medium`
    return `lightweight`

}
