// Ensure native platform-specific dependencies are installed for the current OS/arch.
// This handles the case where node_modules is installed on one platform (e.g. macOS)
// and bind-mounted into another (e.g. Linux Docker container).
// Runs as part of postinstall — safe and idempotent on any platform.

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { arch, platform } from 'os'
import { join } from 'path'

// ─── Ensure Electron binary is present ───────────────────────────────
// Electron's npm package stores the binary path in path.txt after its
// own postinstall downloads the binary. If the file is missing or points
// to a nonexistent path, we re-run Electron's install script to fetch it.
// This fixes "Electron uninstall" errors when node_modules was created
// in a different environment or postinstall was skipped.
const electron_path_file = join( `node_modules`, `electron`, `path.txt` )
const electron_install_script = join( `node_modules`, `electron`, `install.js` )

if( existsSync( electron_install_script ) ) {

    let needs_install = !existsSync( electron_path_file )

    // Even if path.txt exists, verify the binary it points to is actually there
    if( !needs_install ) {
        try {
            const binary_path = readFileSync( electron_path_file, `utf-8` ).trim()
            const full_binary_path = join( `node_modules`, `electron`, binary_path )
            needs_install = !existsSync( full_binary_path )
        } catch {
            needs_install = true
        }
    }

    if( needs_install ) {
        console.log( `Electron binary missing — downloading for ${ platform() }-${ arch() }...` )
        try {
            execSync( `node ${ electron_install_script }`, { stdio: `inherit` } )
        } catch {
            console.warn( `Could not download Electron binary — electron-vite dev will fail` )
        }
    }

}

// ─── Ensure platform-specific native bindings ────────────────────────
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
