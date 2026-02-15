import styled from 'styled-components'
import { Sun, Moon, Monitor } from 'lucide-react'

const Section = styled.div`
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
`

const Label = styled.label`
    display: block;
    font-weight: 500;
    margin-bottom: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.9rem;
`

const Description = styled.p`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const ThemeToggleGroup = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const ThemeButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    font-weight: ${ ( { $active } ) => $active ? `600` : `400` };
    border: 1px solid ${ ( { theme, $active } ) => $active ? theme.colors.text : theme.colors.border };
    background: transparent;
    color: ${ ( { theme, $active } ) => $active ? theme.colors.text : theme.colors.text_secondary };
    transition: all 0.15s;
    min-height: 2.75rem;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.text_secondary };
    }
`

const Textarea = styled.textarea`
    width: 100%;
    min-height: 80px;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    resize: vertical;
    font-family: inherit;
    font-size: 0.85rem;
    line-height: 1.5;
`

const ShortcutsSection = styled.div`
    border-top: 1px solid ${ ( { theme } ) => theme.colors.border_subtle };
    padding-top: ${ ( { theme } ) => theme.spacing.md };
    margin-top: ${ ( { theme } ) => theme.spacing.md };
`

const ShortcutRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } 0` };
    font-size: 0.8rem;
`

const ShortcutKey = styled.code`
    font-family: ${ ( { theme } ) => theme.fonts.mono };
    background: ${ ( { theme } ) => theme.colors.code_background };
    padding: 2px 6px;
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    font-size: 0.75rem;
`

/**
 * Basic settings tab — simple, non-intimidating options only.
 * Temperature and Max Tokens have been moved to the Advanced tab
 * to reduce cognitive load for non-technical users.
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {Function} props.on_theme_change - Handler for theme changes
 * @param {string} props.system_prompt - Current system prompt
 * @param {Function} props.on_system_prompt_change - Handler for system prompt changes
 * @returns {JSX.Element}
 */
export default function BasicSettings( {
    theme_preference,
    on_theme_change,
    system_prompt,
    on_system_prompt_change,
} ) {

    return <>

        { /* Theme */ }
        <Section>
            <Label>Appearance</Label>
            <Description>Choose how the app looks.</Description>
            <ThemeToggleGroup>
                <ThemeButton
                    $active={ theme_preference === `light` }
                    onClick={ () => on_theme_change( `light` ) }
                >
                    <Sun size={ 14 } /> Light
                </ThemeButton>
                <ThemeButton
                    $active={ theme_preference === `dark` }
                    onClick={ () => on_theme_change( `dark` ) }
                >
                    <Moon size={ 14 } /> Dark
                </ThemeButton>
                <ThemeButton
                    $active={ theme_preference === `system` }
                    onClick={ () => on_theme_change( `system` ) }
                >
                    <Monitor size={ 14 } /> System
                </ThemeButton>
            </ThemeToggleGroup>
        </Section>

        { /* System Prompt */ }
        <Section>
            <Label>Custom Instructions</Label>
            <Description>
                Tell the AI how to behave. For example: "Always reply in French"
                or "Explain things simply".
            </Description>
            <Textarea
                data-testid="system-prompt-input"
                value={ system_prompt }
                onChange={ ( e ) => on_system_prompt_change( e.target.value ) }
                placeholder="e.g. You are a friendly assistant who explains things simply..."
            />
        </Section>

        { /* Keyboard Shortcuts Reference */ }
        <ShortcutsSection>
            <Label>Keyboard Shortcuts</Label>
            <ShortcutRow>
                <span>New Chat</span>
                <ShortcutKey>Ctrl+N</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Toggle Sidebar</span>
                <ShortcutKey>Ctrl+Shift+S</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Settings</span>
                <ShortcutKey>Ctrl+,</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Stop Generation</span>
                <ShortcutKey>Ctrl+Shift+Backspace</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Close Modal</span>
                <ShortcutKey>Esc</ShortcutKey>
            </ShortcutRow>
        </ShortcutsSection>

    </>

}
