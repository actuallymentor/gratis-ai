const { contextBridge, ipcRenderer } = require( `electron` )

contextBridge.exposeInMainWorld( `electronAPI`, {

    // Flag for runtime detection
    native_inference: true,

    // Model lifecycle
    load_model: ( model_path ) => ipcRenderer.invoke( `llm:load`, model_path ),
    unload_model: () => ipcRenderer.invoke( `llm:unload` ),
    get_loaded_model: () => ipcRenderer.invoke( `llm:status` ),

    // Inference
    chat: ( messages, opts ) => ipcRenderer.invoke( `llm:chat`, messages, opts ),
    start_stream: ( messages, opts ) => ipcRenderer.invoke( `llm:chat_stream`, messages, opts ),
    on_stream_token: ( callback ) => ipcRenderer.on( `llm:stream-token`, ( _, token ) => callback( token ) ),
    abort: () => ipcRenderer.invoke( `llm:abort` ),

    // Model management
    list_models: () => ipcRenderer.invoke( `llm:list_models` ),
    delete_model: ( model_id ) => ipcRenderer.invoke( `llm:delete_model`, model_id ),

} )
