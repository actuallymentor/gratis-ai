/**
 * Register global keyboard shortcuts
 * @param {Object} handlers - Map of shortcut actions
 * @param {Function} [handlers.new_chat] - Ctrl+N: Create new chat
 * @param {Function} [handlers.toggle_sidebar] - Ctrl+Shift+S: Toggle sidebar
 * @param {Function} [handlers.open_settings] - Ctrl+,: Open settings
 * @param {Function} [handlers.close_modal] - Escape: Close any modal
 * @param {Function} [handlers.stop_generation] - Ctrl+Shift+Backspace: Stop generation
 * @returns {Function} Cleanup function to remove the listener
 */
export const register_shortcuts = ( handlers ) => {

    const handle_keydown = ( e ) => {

        const is_ctrl = e.ctrlKey || e.metaKey

        // Ctrl+N — New chat
        if( is_ctrl && !e.shiftKey && e.key === `n` ) {
            e.preventDefault()
            handlers.new_chat?.()
            return
        }

        // Ctrl+Shift+S — Toggle sidebar
        if( is_ctrl && e.shiftKey && e.key === `S` ) {
            e.preventDefault()
            handlers.toggle_sidebar?.()
            return
        }

        // Ctrl+, — Open settings
        if( is_ctrl && e.key === `,` ) {
            e.preventDefault()
            handlers.open_settings?.()
            return
        }

        // Escape — Close modal
        if( e.key === `Escape` ) {
            handlers.close_modal?.()
            return
        }

        // Ctrl+Shift+Backspace — Stop generation
        if( is_ctrl && e.shiftKey && e.key === `Backspace` ) {
            e.preventDefault()
            handlers.stop_generation?.()
        }

    }

    window.addEventListener( `keydown`, handle_keydown )
    return () => window.removeEventListener( `keydown`, handle_keydown )

}
