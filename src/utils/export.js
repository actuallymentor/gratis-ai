import { log } from 'mentie'

/**
 * Export a conversation as a markdown file
 * @param {Object} conversation - Conversation object with title
 * @param {Array} messages - Array of message objects with role and content
 */
export const export_conversation = ( conversation, messages ) => {

    // Build markdown content
    const lines = [ `# ${ conversation.title }`, `` ]

    for( const msg of messages ) {
        const role_header = msg.role === `user` ? `## User` : `## Assistant`
        lines.push( role_header )
        lines.push( `` )
        lines.push( msg.content )
        lines.push( `` )
    }

    const markdown = lines.join( `\n` )

    // Slugify title for filename
    const slug = conversation.title
        .toLowerCase()
        .replace( /[^a-z0-9]+/g, `-` )
        .replace( /^-|-$/g, `` )
        .slice( 0, 50 )

    const timestamp = new Date().toISOString().replace( /[:.]/g, `-` ).slice( 0, 19 )
    const filename = `${ slug }-${ timestamp }.md`

    log.info( `[export] "${ conversation.title }" — ${ messages.length } messages as ${ filename }` )

    // Trigger browser download
    const blob = new Blob( [ markdown ], { type: `text/markdown` } )
    const url = URL.createObjectURL( blob )
    const link = document.createElement( `a` )
    link.href = url
    link.download = filename
    document.body.appendChild( link )
    link.click()
    document.body.removeChild( link )
    URL.revokeObjectURL( url )

}
