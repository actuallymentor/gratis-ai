import WllamaProvider from './wllama_provider'

/**
 * Creates the appropriate LLM provider based on runtime environment
 * @returns {import('./types').LLMProvider} The provider instance for the current runtime
 */
export function create_provider() {

    // Use native inference when running in Electron
    if( typeof window !== `undefined` && window.electronAPI?.native_inference ) {
        // ElectronIPCProvider will be implemented in Phase 13
        // For now, fall back to wllama
        return new WllamaProvider()
    }

    // Default to browser-based wllama provider
    return new WllamaProvider()

}
