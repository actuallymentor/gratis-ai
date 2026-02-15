import { memo, useState } from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import StreamingIndicator from '../atoms/StreamingIndicator'
import GenerationStats from '../atoms/GenerationStats'
import MessageActions from './MessageActions'

const BubbleContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-self: ${ ( { $is_user } ) => $is_user ? `flex-end` : `flex-start` };
    max-width: 85%;
    position: relative;

    &:hover .message-actions {
        opacity: 1;
    }
`

const Bubble = styled.div`
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } 0` };
    background: transparent;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 65ch;

    /* Markdown styling */
    p { margin: 0 0 0.5em 0; }
    p:last-child { margin-bottom: 0; }
    ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
    code {
        font-family: ${ ( { theme } ) => theme.fonts.mono };
        font-size: 0.85em;
        background: ${ ( { theme } ) => theme.colors.code_background };
        padding: 0.1em 0.3em;
        border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    }
    pre {
        position: relative;
        background: ${ ( { theme } ) => theme.colors.code_background };
        border-radius: ${ ( { theme } ) => theme.border_radius.md };
        padding: ${ ( { theme } ) => theme.spacing.md };
        overflow-x: auto;
        margin: 0.5em 0;
    }
    pre code {
        background: none;
        padding: 0;
    }
    blockquote {
        border-left: 2px solid ${ ( { theme } ) => theme.colors.border };
        padding-left: ${ ( { theme } ) => theme.spacing.md };
        margin: 0.5em 0;
        color: ${ ( { theme } ) => theme.colors.text_secondary };
    }
`

const EditContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    width: 100%;
`

const EditTextarea = styled.textarea`
    width: 100%;
    min-height: 80px;
    padding: ${ ( { theme } ) => theme.spacing.md };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    resize: vertical;
    font-family: inherit;
    font-size: 0.9rem;
    line-height: 1.5;
`

const EditActions = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    justify-content: flex-end;
`

const EditButton = styled.button`
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    transition: opacity 0.15s;
`

const SubmitButton = styled( EditButton )`
    background: ${ ( { theme } ) => theme.colors.accent };
    color: white;
    &:hover { opacity: 0.85; }
`

const CancelButton = styled( EditButton )`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    &:hover { color: ${ ( { theme } ) => theme.colors.text }; }
`

const CodeCopyButton = styled.button`
    position: absolute;
    top: ${ ( { theme } ) => theme.spacing.sm };
    right: ${ ( { theme } ) => theme.spacing.sm };
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    opacity: 0;
    transition: opacity 0.15s;

    pre:hover & { opacity: 1; }
    &:hover { color: ${ ( { theme } ) => theme.colors.text }; }
`

/**
 * Custom pre component with copy button for code blocks
 */
const CodeBlock = ( { children, ...props } ) => {

    const [ copied, set_copied ] = useState( false )

    const handle_copy = async () => {
        const code = children?.props?.children || ``
        try {
            await navigator.clipboard.writeText( code )
            set_copied( true )
            setTimeout( () => set_copied( false ), 2000 )
        } catch {
            toast.error( `Failed to copy code` )
        }
    }

    return <pre { ...props }>
        { children }
        <CodeCopyButton onClick={ handle_copy } aria-label="Copy code">
            { copied ? <Check size={ 14 } /> : <Copy size={ 14 } /> }
        </CodeCopyButton>
    </pre>

}

/**
 * Individual message bubble with markdown rendering and actions
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {boolean} props.is_streaming - Whether this message is currently streaming
 * @param {boolean} props.is_last_assistant - Whether this is the last assistant message
 * @param {Function} props.on_regenerate - Regenerate handler
 * @param {Function} props.on_edit - Edit handler
 * @returns {JSX.Element}
 */
const MessageBubble = memo( ( {
    message,
    is_streaming,
    is_last_assistant,
    on_regenerate,
    on_edit,
} ) => {

    const is_user = message.role === `user`
    const [ is_editing, set_is_editing ] = useState( false )
    const [ edit_text, set_edit_text ] = useState( message.content )

    const handle_edit_submit = () => {
        if( on_edit && edit_text.trim() ) {
            on_edit( edit_text.trim() )
            set_is_editing( false )
        }
    }

    const handle_edit_cancel = () => {
        set_edit_text( message.content )
        set_is_editing( false )
    }

    const testid = is_user ? `user-message` : `assistant-message`

    return <BubbleContainer $is_user={ is_user }>

        <MessageActions
            content={ message.content }
            can_regenerate={ !is_user && is_last_assistant && !is_streaming }
            can_edit={ is_user && !is_streaming }
            on_regenerate={ on_regenerate }
            on_edit={ () => set_is_editing( true ) }
        />

        { is_editing ?
            <EditContainer>
                <EditTextarea
                    data-testid="message-edit-textarea"
                    value={ edit_text }
                    onChange={ ( e ) => set_edit_text( e.target.value ) }
                    autoFocus
                />
                <EditActions>
                    <CancelButton
                        data-testid="message-edit-cancel"
                        onClick={ handle_edit_cancel }
                    >
                        Cancel
                    </CancelButton>
                    <SubmitButton
                        data-testid="message-edit-submit"
                        onClick={ handle_edit_submit }
                    >
                        Submit
                    </SubmitButton>
                </EditActions>
            </EditContainer>
            :
            <Bubble data-testid={ testid } $is_user={ is_user }>
                <ReactMarkdown
                    remarkPlugins={ [ remarkGfm ] }
                    rehypePlugins={ [ rehypeHighlight ] }
                    components={ { pre: CodeBlock } }
                >
                    { message.content }
                </ReactMarkdown>
                { is_streaming && <StreamingIndicator /> }
            </Bubble> }

        { /* Generation stats for completed assistant messages */ }
        { !is_user && !is_streaming && message.stats &&
            <GenerationStats stats={ message.stats } /> }

    </BubbleContainer>

} )

export default MessageBubble
