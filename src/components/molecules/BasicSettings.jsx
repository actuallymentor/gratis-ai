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
    border: 1px solid ${ ( { theme, $active } ) => $active ? theme.colors.primary : theme.colors.border };
    background: ${ ( { theme, $active } ) => $active ? theme.colors.primary + `20` : `transparent` };
    color: ${ ( { theme, $active } ) => $active ? theme.colors.primary : theme.colors.text_secondary };
    transition: all 0.2s;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.primary };
    }
`

const SliderRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
`

const Slider = styled.input`
    flex: 1;
    accent-color: ${ ( { theme } ) => theme.colors.primary };
`

const NumberInput = styled.input`
    width: 70px;
    padding: ${ ( { theme } ) => theme.spacing.xs };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    text-align: center;
    font-size: 0.85rem;
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
    border-top: 1px solid ${ ( { theme } ) => theme.colors.border };
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
    border-radius: 4px;
    font-size: 0.75rem;
`

/**
 * Basic settings tab content
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {Function} props.on_theme_change - Handler for theme changes
 * @param {number} props.temperature - Current temperature
 * @param {Function} props.on_temperature_change - Handler for temperature changes
 * @param {number} props.max_tokens - Current max tokens
 * @param {Function} props.on_max_tokens_change - Handler for max tokens changes
 * @param {string} props.system_prompt - Current system prompt
 * @param {Function} props.on_system_prompt_change - Handler for system prompt changes
 * @returns {JSX.Element}
 */
export default function BasicSettings( {
    theme_preference,
    on_theme_change,
    temperature,
    on_temperature_change,
    max_tokens,
    on_max_tokens_change,
    system_prompt,
    on_system_prompt_change,
} ) {

    return <>

        { /* Theme */ }
        <Section>
            <Label>Theme</Label>
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

        { /* Temperature */ }
        <Section>
            <Label>Temperature</Label>
            <Description>Controls randomness. Lower is more deterministic.</Description>
            <SliderRow>
                <Slider
                    data-testid="temperature-slider"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={ temperature }
                    onChange={ ( e ) => on_temperature_change( parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    data-testid="temperature-input"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={ temperature }
                    onChange={ ( e ) => on_temperature_change( parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Max Tokens */ }
        <Section>
            <Label>Max Tokens</Label>
            <Description>Maximum number of tokens to generate.</Description>
            <NumberInput
                data-testid="max-tokens-input"
                type="number"
                min="64"
                max="32768"
                step="64"
                value={ max_tokens }
                onChange={ ( e ) => on_max_tokens_change( parseInt( e.target.value ) || 64 ) }
                style={ { width: `120px` } }
            />
        </Section>

        { /* System Prompt */ }
        <Section>
            <Label>System Prompt</Label>
            <Description>Instructions given to the model before each conversation.</Description>
            <Textarea
                data-testid="system-prompt-input"
                value={ system_prompt }
                onChange={ ( e ) => on_system_prompt_change( e.target.value ) }
                placeholder="You are a helpful assistant..."
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
                <span>Export Chat</span>
                <ShortcutKey>Ctrl+Shift+S</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Settings</span>
                <ShortcutKey>Ctrl+,</ShortcutKey>
            </ShortcutRow>
            <ShortcutRow>
                <span>Close Modal</span>
                <ShortcutKey>Esc</ShortcutKey>
            </ShortcutRow>
        </ShortcutsSection>

    </>

}
