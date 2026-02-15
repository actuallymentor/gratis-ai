// Copy wllama WASM binaries to public/ so Vite can serve them as static assets
import { cpSync, mkdirSync } from 'fs'

const src = `node_modules/@wllama/wllama/esm`
const dst = `public/wasm`

mkdirSync( `${ dst }/single-thread`, { recursive: true } )
mkdirSync( `${ dst }/multi-thread`, { recursive: true } )

cpSync( `${ src }/single-thread/wllama.wasm`, `${ dst }/single-thread/wllama.wasm` )
cpSync( `${ src }/multi-thread/wllama.wasm`, `${ dst }/multi-thread/wllama.wasm` )

console.log( `Copied WASM binaries to ${ dst }/` )
