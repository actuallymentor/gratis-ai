// Ensure native platform-specific dependencies are installed for the current OS/arch.
// This handles the case where node_modules is installed on one platform (e.g. macOS)
// and bind-mounted into another (e.g. Linux Docker container).
// Runs as part of postinstall — safe and idempotent on any platform.

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { arch, platform } from 'os'

// Map of packages that ship platform-specific native binaries as optional deps
const platform_native_packages = [
    {
        // Rollup uses @rollup/rollup-{os}-{arch} optional binaries
        base: `@rollup/rollup`,
        get native_pkg() {
            const os_map = { linux: `linux`, darwin: `darwin`, win32: `win32` }
            const arch_map = { arm64: `arm64`, x64: `x64` }
            const os_name = os_map[ platform() ]
            const arch_name = arch_map[ arch() ]
            if( !os_name || !arch_name ) return null
            // Linux arm64 needs the -gnu suffix
            const suffix = os_name === `linux` ? `-gnu` : ``
            return `${ this.base }-${ os_name }-${ arch_name }${ suffix }`
        },
    },
]

for( const { native_pkg } of platform_native_packages ) {

    if( !native_pkg ) continue

    const pkg_path = `node_modules/${ native_pkg }`

    if( existsSync( pkg_path ) ) continue

    // Install the missing native binding without saving to package.json
    console.log( `Installing missing platform dep: ${ native_pkg }` )
    try {
        execSync( `npm install --no-save ${ native_pkg }`, { stdio: `inherit` } )
    } catch {
        console.warn( `Could not install ${ native_pkg } — Vite may use JS fallback (slower)` )
    }

}
