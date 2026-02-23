/**
 * @typedef {Object} DeviceCapabilities
 * @property {Object} gpu
 * @property {boolean} gpu.available
 * @property {boolean} gpu.webgpu - True if WebGPU API is available
 * @property {boolean} gpu.webgl - True if WebGL2 is available
 * @property {string} gpu.renderer - GPU name from WebGL debug info
 * @property {string} gpu.vendor - GPU vendor
 * @property {number} gpu.estimated_vram - Estimated VRAM in GB (heuristic)
 * @property {boolean} [gpu.metal] - True if Metal GPU acceleration is available (Electron only)
 * @property {boolean} [gpu.cuda] - True if CUDA GPU acceleration is available (Electron only)
 * @property {boolean} [gpu.vulkan] - True if Vulkan GPU acceleration is available (Electron only)
 * @property {number} [gpu.vram_total] - Total VRAM in bytes (Electron only)
 * @property {number} [gpu.vram_free] - Free VRAM in bytes (Electron only)
 * @property {number} [gpu.unified_memory] - Unified memory pool in bytes — >0 on Apple Silicon (Electron only)
 * @property {string[]} [gpu.device_names] - GPU device names (Electron only)
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
 * Detects device capabilities for model tier recommendation.
 * In Electron, uses real system info from the main process via IPC — including
 * GPU type, VRAM, and unified memory detection from node-llama-cpp.
 * In browser, uses navigator APIs and WebGPU/WebGL probing.
 * @returns {Promise<DeviceCapabilities>}
 */
export const detect_capabilities = async () => {

    // Detect runtime
    const runtime = typeof window !== `undefined` && window.electronAPI?.native_inference
        ? `electron`
        : `browser`

    // In Electron, fetch real system info + GPU capabilities from the main process
    if( runtime === `electron` ) {

        const sys = await window.electronAPI.get_system_info()
        const total_gb = sys.total_memory / 1_000_000_000
        const gpu = sys.gpu || {}

        // Determine a human-readable renderer name
        const device_names = gpu.device_names || []
        const renderer = device_names.length
            ? device_names.join( `, ` )
            : gpu.type ? `${ gpu.type } (node-llama-cpp)` : `CPU`

        return {
            gpu: {
                available: !!gpu.type,
                webgpu: false,
                webgl: false,
                renderer,
                vendor: `System`,
                estimated_vram: gpu.vram_total ? gpu.vram_total / 1_000_000_000 : 0,
                // Native GPU capabilities from node-llama-cpp
                metal: !!gpu.metal,
                cuda: !!gpu.cuda,
                vulkan: !!gpu.vulkan,
                vram_total: gpu.vram_total || 0,
                vram_free: gpu.vram_free || 0,
                unified_memory: gpu.unified_memory || 0,
                device_names,
            },
            memory: {
                device_memory: total_gb,
                total_bytes: sys.total_memory,
                free_bytes: sys.free_memory,
                js_heap_limit: null,
            },
            cpu: {
                cores: sys.cpus,
            },
            runtime,
            platform: sys.platform,
            arch: sys.arch,
        }

    }

    // Browser path: probe GPU capabilities
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
 * Estimate the largest GGUF model (in bytes) the runtime can load.
 *
 * ## Electron (native node-llama-cpp)
 *
 * No WASM ceiling — the memory budget depends on GPU acceleration:
 *
 * - **Apple Silicon (Metal + unified memory)**: GPU and CPU share the same RAM
 *   pool. macOS allows Metal to access ~75% of physical RAM. For a single-user
 *   chat app with no other heavy processes, we budget 75% of total RAM.
 *   → 8 GB Mac ≈ 6.0 GB budget  → Mistral 7B (5.1 GB) fits
 *   → 16 GB Mac ≈ 12 GB budget  → Mistral 7B easily, larger models too
 *   → 32 GB Mac ≈ 24 GB budget  → Mixtral 8x7B (26.4 GB) is tight
 *
 * - **Discrete GPU (CUDA / Vulkan)**: VRAM is the primary constraint for
 *   GPU-offloaded layers, but node-llama-cpp can spill to system RAM for
 *   partial offloading. We use max(VRAM, 60% of system RAM) to allow both
 *   pure-GPU and hybrid configurations.
 *
 * - **CPU-only (no GPU)**: System RAM is the sole constraint. This is a
 *   dedicated desktop app doing single-user inference, so 70% of total RAM
 *   is a safe budget (leaves room for OS, Electron, and small apps).
 *
 * ## Browser (WASM)
 *
 * Limited to the ~4 GB WASM 32-bit address space minus runtime overhead.
 * Also capped against navigator.deviceMemory and jsHeapSizeLimit.
 *
 * @param {DeviceCapabilities} capabilities
 * @returns {number} Max model file size in bytes
 */
export const estimate_max_model_bytes = ( capabilities ) => {

    if( capabilities?.runtime === `electron` && capabilities?.memory?.total_bytes ) {

        const total = capabilities.memory.total_bytes
        const gpu = capabilities.gpu || {}

        // Apple Silicon: unified memory — GPU/CPU share the same pool
        // macOS lets Metal access up to ~75% of physical RAM
        if( gpu.unified_memory > 0 || gpu.metal ) {
            const unified = gpu.unified_memory || total
            return Math.floor( unified * 0.75 )
        }

        // Discrete GPU: use the larger of VRAM or 60% system RAM
        // This handles partial offloading where layers spill to system RAM
        if( gpu.vram_total > 0 ) {
            return Math.floor( Math.max( gpu.vram_total, total * 0.6 ) )
        }

        // CPU-only: 70% of system RAM — generous for a dedicated single-user app
        return Math.floor( total * 0.7 )

    }

    // Browser: hard ceiling from WASM 32-bit address space minus runtime overhead (~600 MB)
    const wasm_ceiling = 3_400_000_000

    // If the browser reports device memory, use 60% of it as a soft cap
    // (the rest is needed by the browser, OS, and other tabs)
    const device_mem = capabilities?.memory?.device_memory
    const device_cap = device_mem ? device_mem * 0.6 * 1_000_000_000 : Infinity

    // Chrome exposes jsHeapSizeLimit — useful as a cross-check
    const heap_limit = capabilities?.memory?.js_heap_limit
    const heap_cap = heap_limit ? heap_limit * 0.7 : Infinity

    return Math.floor( Math.min( wasm_ceiling, device_cap, heap_cap ) )

}

