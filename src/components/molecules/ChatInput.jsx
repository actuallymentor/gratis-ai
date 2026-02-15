import { useState, useRef, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { SendHorizonal, Square, Mic, Loader } from 'lucide-react'
import VoiceStatusBar from '../atoms/VoiceStatusBar'

const InputContainer = styled.div`
    display: flex;
    align-items: flex-end;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding: ${ ( { theme } ) => theme.spacing.md };
    background: ${ ( { theme } ) => theme.colors.background };
    max-width: 65ch;
    width: 100%;
    margin: 0 auto;
`

const TextArea = styled.textarea`
    flex: 1;
    min-height: 2.75rem;
    max-height: 200px;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid transparent;
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    resize: none;
    line-height: 1.5;

    &::placeholder {
        color: ${ ( { theme } ) => theme.colors.text_muted };
    }

    &:focus {
        outline: none;
        border-color: ${ ( { theme } ) => theme.colors.border };
    }
`

const SendButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme } ) => theme.colors.primary };
    color: ${ ( { theme } ) => theme.colors.background };
    transition: opacity 0.15s;
    flex-shrink: 0;

    &:hover { opacity: 0.8; }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`

const StopButton = styled( SendButton )`
    background: ${ ( { theme } ) => theme.colors.error };
    color: white;
    &:hover { opacity: 0.8; }
`

// Pulsing red animation for active recording
const pulse_recording = keyframes`
    0%, 100% { transform: scale( 1 ); opacity: 1; }
    50% { transform: scale( 1.05 ); opacity: 0.7; }
`

const MicButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: transparent;
    color: ${ ( { theme, $is_recording } ) => $is_recording
        ? theme.colors.error
        : theme.colors.text_muted };
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;

    &:hover {
        color: ${ ( { theme, $is_recording } ) => $is_recording
        ? theme.colors.error
        : theme.colors.text };
        background: ${ ( { theme } ) => theme.colors.input_background };
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    ${ ( { $is_recording } ) => $is_recording && css`
        animation: ${ pulse_recording } 1.5s ease-in-out infinite;

        @media ( prefers-reduced-motion: reduce ) {
            animation: none;
        }
    ` }
`

// Spinning loader for transcription in progress
const spin = keyframes`
    from { transform: rotate( 0deg ); }
    to { transform: rotate( 360deg ); }
`

const SpinnerIcon = styled( Loader )`
    animation: ${ spin } 1s linear infinite;

    @media ( prefers-reduced-motion: reduce ) {
        animation: none;
    }
`

/**
 * Chat input bar with mic, send, and stop buttons.
 * When voice is active, the textarea is replaced by an inline status indicator
 * so the feedback sits in the same visual slot, aligned with the action buttons.
 * @param {Object} props
 * @param {Function} props.on_send - Handler for sending a message
 * @param {Function} props.on_stop - Handler for stopping generation
 * @param {boolean} props.is_generating - Whether currently generating
 * @param {boolean} props.disabled - Disable input
 * @param {Function} [props.on_mic_click] - Handler when mic button is clicked (not recording)
 * @param {Function} [props.on_mic_stop] - Handler when mic button is clicked to stop recording
 * @param {boolean} [props.is_recording] - Whether mic is actively recording
 * @param {boolean} [props.is_transcribing] - Whether transcription is in progress
 * @param {boolean} [props.is_loading_model] - Whether the voice model is loading into memory
 * @param {number} [props.audio_level] - Normalised audio input level 0–1
 * @param {number|null} [props.recording_start_time] - Timestamp when recording began
 * @param {string} [props.append_text] - Text to inject into the textarea (from voice transcription)
 * @returns {JSX.Element}
 */
export default function ChatInput( {
    on_send,
    on_stop,
    is_generating,
    disabled,
    on_mic_click,
    on_mic_stop,
    is_recording = false,
    is_transcribing = false,
    is_loading_model = false,
    audio_level = 0,
    recording_start_time = null,
    append_text,
} ) {

    const [ text, set_text ] = useState( `` )
    const textarea_ref = useRef( null )

    // Whether any voice state is active (recording, transcribing, or loading model)
    const voice_active = is_recording || is_transcribing || is_loading_model

    // Auto-resize textarea
    useEffect( () => {
        if( textarea_ref.current ) {
            textarea_ref.current.style.height = `auto`
            textarea_ref.current.style.height = `${ textarea_ref.current.scrollHeight }px`
        }
    }, [ text ] )

    // Inject transcribed text when append_text changes
    useEffect( () => {

        if( append_text ) {
            set_text( prev => {
                // Add a space separator if there's already text
                const separator = prev.trim() ? ` ` : ``
                return `${ prev }${ separator }${ append_text }`
            } )
        }

    }, [ append_text ] )

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

    const handle_mic = () => {
        if( is_recording ) {
            on_mic_stop?.()
        } else {
            on_mic_click?.()
        }
    }

    return <InputContainer>

        { /* Textarea or inline voice status — they share the same flex slot */ }
        { voice_active ?
            <VoiceStatusBar
                is_recording={ is_recording }
                is_transcribing={ is_transcribing }
                is_loading_model={ is_loading_model }
                audio_level={ audio_level }
                recording_start_time={ recording_start_time }
            />
            :
            <TextArea
                ref={ textarea_ref }
                data-testid="chat-input"
                value={ text }
                onChange={ ( e ) => set_text( e.target.value ) }
                onKeyDown={ handle_keydown }
                placeholder="Type a message..."
                disabled={ disabled || is_generating }
                rows={ 1 }
            /> }

        { /* Mic button — shows spinner when transcribing or loading model */ }
        { is_transcribing || is_loading_model ?
            <MicButton disabled aria-label={ is_transcribing ? `Transcribing` : `Loading voice model` }>
                <SpinnerIcon size={ 18 } />
            </MicButton>
            :
            <MicButton
                data-testid="mic-btn"
                onClick={ handle_mic }
                $is_recording={ is_recording }
                disabled={ disabled || is_generating }
                aria-label={ is_recording ? `Stop recording` : `Voice input` }
            >
                <Mic size={ 18 } />
            </MicButton> }

        { /* Send or Stop button */ }
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
