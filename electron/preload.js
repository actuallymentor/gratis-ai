const { contextBridge, ipcRenderer } = require( `electron` )

contextBridge.exposeInMainWorld( `electronAPI`, {

    // Flag for runtime detection
    native_inference: true,

    // System info for device detection
    get_system_info: () => ipcRenderer.invoke( `system:info` ),

    // Model lifecycle
    load_model: ( model_path ) => ipcRenderer.invoke( `llm:load`, model_path ),
    unload_model: () => ipcRenderer.invoke( `llm:unload` ),
    get_loaded_model: () => ipcRenderer.invoke( `llm:status` ),

    // Inference
    chat: ( messages, opts ) => ipcRenderer.invoke( `llm:chat`, messages, opts ),
    start_stream: ( messages, opts ) => ipcRenderer.invoke( `llm:chat_stream`, messages, opts ),
    on_stream_token: ( callback ) => ipcRenderer.on( `llm:stream-token`, ( _, token ) => callback( token ) ),
    on_stream_done: ( callback ) => ipcRenderer.on( `llm:stream-done`, () => callback() ),
    abort: () => ipcRenderer.invoke( `llm:abort` ),

    // Model management
    list_models: () => ipcRenderer.invoke( `llm:list_models` ),
    delete_model: ( model_id ) => ipcRenderer.invoke( `llm:delete_model`, model_id ),
    save_model: ( data ) => ipcRenderer.invoke( `llm:save_model`, data ),

} )
