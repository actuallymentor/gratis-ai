// Generate random binary files for client-side speed estimation.
// Random data resists gzip/brotli compression, ensuring honest measurements.
// Skips files that already exist to avoid slow regeneration on every install.

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomBytes } from 'crypto'

const dst = `public/speedtest`

const files = [
    { name: `1mib.bin`,  bytes: 1 * 1024 * 1024 },
    { name: `10mib.bin`, bytes: 10 * 1024 * 1024 },
    { name: `25mib.bin`, bytes: 25 * 1024 * 1024 },
]

mkdirSync( dst, { recursive: true } )

for( const { name, bytes } of files ) {

    const path = `${ dst }/${ name }`

    if( existsSync( path ) ) {
        console.log( `  ✓ ${ path } already exists, skipping` )
        continue
    }

    writeFileSync( path, randomBytes( bytes ) )
    console.log( `  ✓ Generated ${ path } (${ bytes / 1024 / 1024 } MiB)` )

}

console.log( `Speed-test files ready in ${ dst }/` )
