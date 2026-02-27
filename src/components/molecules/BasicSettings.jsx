import styled from 'styled-components'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

    const { t } = useTranslation( `settings` )

    return <>

        { /* Theme */ }
        <Section>
            <Label>{ t( `appearance` ) }</Label>
            <Description>{ t( `appearance_description` ) }</Description>
            <ThemeToggleGroup>
                <ThemeButton
                    $active={ theme_preference === `light` }
                    onClick={ () => on_theme_change( `light` ) }
                >
                    <Sun size={ 14 } /> { t( `theme_light` ) }
                </ThemeButton>
                <ThemeButton
                    $active={ theme_preference === `dark` }
                    onClick={ () => on_theme_change( `dark` ) }
                >
                    <Moon size={ 14 } /> { t( `theme_dark` ) }
                </ThemeButton>
                <ThemeButton
                    $active={ theme_preference === `system` }
                    onClick={ () => on_theme_change( `system` ) }
                >
                    <Monitor size={ 14 } /> { t( `theme_system` ) }
                </ThemeButton>
            </ThemeToggleGroup>
        </Section>

        { /* System Prompt */ }
        <Section>
            <Label>{ t( `custom_instructions` ) }</Label>
            <Description>{ t( `custom_instructions_description` ) }</Description>
            <Textarea
                data-testid="system-prompt-input"
                value={ system_prompt }
                onChange={ ( e ) => on_system_prompt_change( e.target.value ) }
                placeholder={ t( `custom_instructions_placeholder` ) }
            />
        </Section>

        { /* Keyboard Shortcuts Reference */ }
        <ShortcutsSection>
            <Label>{ t( `keyboard_shortcuts` ) }</Label>
            <ShortcutRow>
                <span>{ t( `shortcut_new_chat` ) }</span>
                <ShortcutKey>Ctrl+N</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>{ t( `shortcut_toggle_sidebar` ) }</span>
                <ShortcutKey>Ctrl+Shift+S</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>{ t( `shortcut_settings` ) }</span>
                <ShortcutKey>Ctrl+,</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>{ t( `shortcut_stop_generation` ) }</span>
                <ShortcutKey>Ctrl+Shift+Backspace</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>{ t( `shortcut_close_modal` ) }</span>
                <ShortcutKey>Esc</ShortcutKey>
            </ShortcutRow>
        </ShortcutsSection>

    </>

}
