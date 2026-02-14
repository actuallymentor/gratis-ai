import { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import AppLayout from '../molecules/AppLayout'
import MessageList from '../molecules/MessageList'
import ChatInput from '../molecules/ChatInput'
import use_llm from '../../hooks/use_llm'
import use_chat_history from '../../hooks/use_chat_history'
import use_model_manager from '../../hooks/use_model_manager'
import { export_conversation } from '../../utils/export'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
`

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
`

const Title = styled.h1`
    font-size: 2rem;
    color: ${ ( { theme } ) => theme.colors.primary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

const NoModelBanner = styled.div`
    padding: ${ ( { theme } ) => theme.spacing.md };
    text-align: center;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    font-size: 0.85rem;
`

/**
 * Main chat interface page with layout shell
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {string} props.theme_mode - Resolved theme mode
 * @param {Function} props.on_theme_toggle - Handler for theme cycling
 * @returns {JSX.Element}
 */
export default function ChatPage( { theme_preference, theme_mode, on_theme_toggle } ) {

    const { id: conversation_id } = useParams()
    const navigate = useNavigate()

    const [ messages, set_messages ] = useState( [] )
    const [ model_loaded, set_model_loaded ] = useState( false )
    const [ current_conversation_id, set_current_conversation_id ] = useState( conversation_id || null )
    const is_generating_ref = useRef( false )

    const { load_model, chat_stream, abort, is_generating, loaded_model_id } = use_llm()
    const {
        conversations,
        create_conversation,
        save_message,
        load_messages,
        delete_conversation,
        replace_messages,
        refresh,
    } = use_chat_history()
    const {
        cached_models,
        is_loading: is_model_switching,
        refresh_models,
    } = use_model_manager()

    // Try loading the active model on mount
    useEffect( () => {

        const active_id = localStorage.getItem( `locallm:settings:active_model_id` )
        if( active_id && !loaded_model_id ) {
            load_model( active_id )
                .then( () => set_model_loaded( true ) )
                .catch( () => set_model_loaded( false ) )
        }

    }, [] )

    // Load conversation messages when navigating to /chat/:id
    useEffect( () => {

        if( conversation_id && conversation_id !== current_conversation_id ) {
            set_current_conversation_id( conversation_id )
            load_messages( conversation_id ).then( ( msgs ) => {
                set_messages( msgs.map( ( m ) => ( {
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    stats: m.stats,
                } ) ) )
            } )
        }

        // Reset state when navigating to /chat (no id)
        if( !conversation_id && current_conversation_id ) {
            set_current_conversation_id( null )
            set_messages( [] )
        }

    }, [ conversation_id, current_conversation_id, load_messages ] )

    // Track is_generating in a ref for stable closures
    useEffect( () => {
        is_generating_ref.current = is_generating
    }, [ is_generating ] )

    /**
     * Persist the current messages to IndexedDB
     */
    const persist_messages = useCallback( async ( conv_id, msgs ) => {

        await replace_messages( conv_id, msgs )
        await refresh()

    }, [ replace_messages, refresh ] )

    /**
     * Re-send from existing message history (used by regenerate)
     */
    const send_message_from_history = useCallback( async ( history_msgs, conv_id ) => {

        const assistant_msg = { id: uuid(), role: `assistant`, content: `` }
        const new_messages = [ ...history_msgs, assistant_msg ]
        set_messages( new_messages )

        const system_prompt = localStorage.getItem( `locallm:settings:system_prompt` )
            || import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT
            || ``
        const history = history_msgs.map( ( { role, content } ) => ( { role, content } ) )
        if( system_prompt ) history.unshift( { role: `system`, content: system_prompt } )

        const opts = {
            temperature: parseFloat( localStorage.getItem( `locallm:settings:temperature` ) ) || 0.7,
            max_tokens: parseInt( localStorage.getItem( `locallm:settings:max_tokens` ) ) || 2048,
        }

        try {

            const result = await chat_stream( history, opts, ( full_text ) => {
                set_messages( prev => {
                    const updated = [ ...prev ]
                    updated[ updated.length - 1 ] = { ...updated[ updated.length - 1 ], content: full_text }
                    return updated
                } )
            } )

            // Final update with stats
            set_messages( prev => {
                const updated = [ ...prev ]
                updated[ updated.length - 1 ] = {
                    ...updated[ updated.length - 1 ],
                    content: result.text,
                    stats: result.stats,
                }
                // Persist final state
                if( conv_id ) persist_messages( conv_id, updated )
                return updated
            } )

        } catch {
            // Error handling done in use_llm
        }

    }, [ chat_stream, persist_messages ] )

    /**
     * Regenerate the last assistant message
     */
    const handle_regenerate = useCallback( () => {

        set_messages( prev => {
            const without_last_assistant = prev.slice( 0, -1 )
            const last_user = without_last_assistant[ without_last_assistant.length - 1 ]
            if( last_user?.role === `user` ) {
                setTimeout( () => send_message_from_history( without_last_assistant, current_conversation_id ), 0 )
            }
            return without_last_assistant
        } )

    }, [ send_message_from_history, current_conversation_id ] )

    /**
     * Send a message and generate a response
     */
    const send_message = useCallback( async ( text ) => {

        const user_msg = { id: uuid(), role: `user`, content: text }
        set_messages( prev => [ ...prev, user_msg ] )

        // Create conversation if this is the first message
        let conv_id = current_conversation_id
        if( !conv_id ) {
            conv_id = await create_conversation( text )
            set_current_conversation_id( conv_id )
            navigate( `/chat/${ conv_id }`, { replace: true } )
        }

        // Save user message to IndexedDB
        await save_message( conv_id, user_msg )

        // Add placeholder assistant message
        const assistant_msg = { id: uuid(), role: `assistant`, content: `` }
        set_messages( prev => [ ...prev, assistant_msg ] )

        // Build message history for the provider
        const system_prompt = localStorage.getItem( `locallm:settings:system_prompt` )
            || import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT
            || ``
        const history = [ ...messages, user_msg ].map( ( { role, content } ) => ( { role, content } ) )
        if( system_prompt ) history.unshift( { role: `system`, content: system_prompt } )

        // Build generation options from settings
        const opts = {
            temperature: parseFloat( localStorage.getItem( `locallm:settings:temperature` ) ) || 0.7,
            max_tokens: parseInt( localStorage.getItem( `locallm:settings:max_tokens` ) ) || 2048,
            top_p: parseFloat( localStorage.getItem( `locallm:settings:top_p` ) ) || 0.95,
            top_k: parseInt( localStorage.getItem( `locallm:settings:top_k` ) ) || 40,
            repeat_penalty: parseFloat( localStorage.getItem( `locallm:settings:repeat_penalty` ) ) || 1.1,
        }

        try {

            const result = await chat_stream( history, opts, ( full_text ) => {
                set_messages( prev => {
                    const updated = [ ...prev ]
                    updated[ updated.length - 1 ] = { ...updated[ updated.length - 1 ], content: full_text }
                    return updated
                } )
            } )

            // Final update with stats and persist
            const final_assistant = {
                ...assistant_msg,
                content: result.text,
                stats: result.stats,
            }

            set_messages( prev => {
                const updated = [ ...prev ]
                updated[ updated.length - 1 ] = final_assistant
                return updated
            } )

            // Save assistant message to IndexedDB
            await save_message( conv_id, final_assistant )
            await refresh()

        } catch ( err ) {
            if( err.name !== `AbortError` ) {
                set_messages( prev => {
                    const updated = [ ...prev ]
                    updated[ updated.length - 1 ] = {
                        ...updated[ updated.length - 1 ],
                        content: `Error: ${ err.message }`,
                    }
                    return updated
                } )
            }
        }

    }, [ messages, chat_stream, current_conversation_id, create_conversation, save_message, navigate, refresh ] )

    /**
     * Edit a message and resend from that point
     */
    const handle_edit = useCallback( ( index, new_text ) => {

        set_messages( prev => {
            // Truncate at the edited message
            const truncated = prev.slice( 0, index )
            // Re-send with edited text
            setTimeout( () => send_message( new_text ), 0 )
            return truncated
        } )

    }, [ send_message ] )

    const handle_stop = useCallback( () => {
        abort()
    }, [ abort ] )

    /**
     * Handle new chat — clear messages and navigate
     */
    const handle_new_chat = useCallback( () => {
        set_current_conversation_id( null )
        set_messages( [] )
    }, [] )

    /**
     * Handle exporting a conversation from sidebar
     */
    const handle_export = useCallback( async ( conversation ) => {
        const msgs = await load_messages( conversation.id )
        export_conversation( conversation, msgs )
    }, [ load_messages ] )

    /**
     * Handle deleting a conversation from sidebar
     */
    const handle_delete = useCallback( async ( id ) => {

        await delete_conversation( id )

        // If we deleted the active conversation, navigate to empty chat
        if( id === current_conversation_id ) {
            set_current_conversation_id( null )
            set_messages( [] )
            navigate( `/chat` )
        }

    }, [ delete_conversation, current_conversation_id, navigate ] )

    /**
     * Switch to a different cached model
     */
    const handle_model_switch = useCallback( async ( model_id ) => {

        try {
            await load_model( model_id )
            set_model_loaded( true )
            localStorage.setItem( `locallm:settings:active_model_id`, model_id )
            await refresh_models()
        } catch ( err ) {
            console.error( `Failed to switch model:`, err )
        }

    }, [ load_model, refresh_models ] )

    const has_messages = messages.length > 0

    return <AppLayout
        theme_preference={ theme_preference }
        theme_mode={ theme_mode }
        on_theme_toggle={ on_theme_toggle }
        on_new_chat={ handle_new_chat }
        conversations={ conversations }
        on_export={ handle_export }
        on_delete={ handle_delete }
        cached_models={ cached_models }
        active_model_id={ loaded_model_id }
        is_model_switching={ is_model_switching }
        on_model_switch={ handle_model_switch }
    >
        <Container>

            { !model_loaded && !loaded_model_id &&
                <NoModelBanner>
                    No model loaded. Go to the welcome page to download a model.
                </NoModelBanner> }

            { has_messages ?
                <MessageList
                    messages={ messages }
                    is_streaming={ is_generating }
                    on_regenerate={ handle_regenerate }
                    on_edit={ handle_edit }
                />
                :
                <EmptyState>
                    <Title>localLM</Title>
                    <Subtitle>Ask me anything.</Subtitle>
                </EmptyState> }

            <ChatInput
                on_send={ send_message }
                on_stop={ handle_stop }
                is_generating={ is_generating }
                disabled={ !model_loaded && !loaded_model_id }
            />

        </Container>
    </AppLayout>

}
