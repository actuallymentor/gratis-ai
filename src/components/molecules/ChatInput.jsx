import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { SendHorizonal, Square } from 'lucide-react'

const InputContainer = styled.div`
    display: flex;
    align-items: flex-end;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding: ${ ( { theme } ) => theme.spacing.md };
    border-top: 1px solid ${ ( { theme } ) => theme.colors.border };
    background: ${ ( { theme } ) => theme.colors.surface };
`

const TextArea = styled.textarea`
    flex: 1;
    min-height: 44px;
    max-height: 200px;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    resize: none;
    line-height: 1.5;

    &::placeholder {
        color: ${ ( { theme } ) => theme.colors.text_muted };
    }

    &:focus {
        outline: none;
        border-color: ${ ( { theme } ) => theme.colors.primary };
    }
`

const SendButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    background: ${ ( { theme } ) => theme.colors.primary };
    color: white;
    transition: background 0.2s;
    flex-shrink: 0;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.primary_hover };
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`

const StopButton = styled( SendButton )`
    background: ${ ( { theme } ) => theme.colors.error };
    &:hover { background: ${ ( { theme } ) => theme.colors.error }; }
`

/**
 * Chat input bar with send/stop button
 * @param {Object} props
 * @param {Function} props.on_send - Handler for sending a message
 * @param {Function} props.on_stop - Handler for stopping generation
 * @param {boolean} props.is_generating - Whether currently generating
 * @param {boolean} props.disabled - Disable input
 * @returns {JSX.Element}
 */
export default function ChatInput( { on_send, on_stop, is_generating, disabled } ) {

    const [ text, set_text ] = useState( `` )
    const textarea_ref = useRef( null )

    // Auto-resize textarea
    useEffect( () => {
        if( textarea_ref.current ) {
            textarea_ref.current.style.height = `auto`
            textarea_ref.current.style.height = `${ textarea_ref.current.scrollHeight }px`
        }
    }, [ text ] )

    const handle_send = () => {
        if( text.trim() && !disabled ) {
            on_send( text.trim() )
            set_text( `` )
        }
    }

    const handle_keydown = ( e ) => {
        if( e.key === `Enter` && !e.shiftKey ) {
            e.preventDefault()
            handle_send()
        }
    }

    return <InputContainer>

        <TextArea
            ref={ textarea_ref }
            data-testid="chat-input"
            value={ text }
            onChange={ ( e ) => set_text( e.target.value ) }
            onKeyDown={ handle_keydown }
            placeholder="Type a message..."
            disabled={ disabled || is_generating }
            rows={ 1 }
        />

        { is_generating ? 
            <StopButton
                data-testid="stop-btn"
                onClick={ on_stop }
                aria-label="Stop generation"
            >
                <Square size={ 18 } />
            </StopButton>
            : 
            <SendButton
                data-testid="send-btn"
                onClick={ handle_send }
                disabled={ !text.trim() || disabled }
                aria-label="Send message"
            >
                <SendHorizonal size={ 18 } />
            </SendButton> }

    </InputContainer>

}
