import { log } from 'mentie'
import WllamaProvider from './wllama_provider'

/**
 * Creates the appropriate LLM provider based on runtime environment
 * In Electron, uses IPC to communicate with node-llama-cpp in the main process.
 * In the browser, uses wllama for WASM-based inference.
 * @returns {Promise<import('./types').LLMProvider>} The provider instance
 */
export async function create_provider() {

    // Use native inference when running in Electron
    if( typeof window !== `undefined` && window.electronAPI?.native_inference ) {
        log.info( `[factory] Using Electron native inference` )
        const { default: ElectronIPCProvider } = await import( `./electron_ipc_provider.js` )
        return new ElectronIPCProvider()
    }

    // Default to browser-based wllama provider
    log.info( `[factory] Using browser WASM provider` )
    return new WllamaProvider()

}
