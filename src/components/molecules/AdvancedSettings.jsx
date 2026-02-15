import styled from 'styled-components'

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
    line-height: 1.4;
`

const SliderRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
`

const Slider = styled.input`
    flex: 1;
    accent-color: ${ ( { theme } ) => theme.colors.accent };
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

const TextInput = styled.input`
    width: 100%;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.sm };
    font-size: 0.85rem;
`

const Divider = styled.div`
    height: 1px;
    background: ${ ( { theme } ) => theme.colors.border_subtle };
    margin: ${ ( { theme } ) => `${ theme.spacing.lg } 0` };
`

const DividerLabel = styled.p`
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

/**
 * Advanced settings tab — includes Temperature and Max Tokens
 * (moved from Basic for progressive disclosure) plus all fine-tuning knobs.
 * Descriptions are written in plain language.
 * @param {Object} props
 * @param {Object} props.settings - Current settings values
 * @param {Function} props.on_change - Handler for setting changes (key, value)
 * @returns {JSX.Element}
 */
export default function AdvancedSettings( { settings, on_change } ) {

    return <>

        { /* Temperature — moved from Basic */ }
        <Section>
            <Label>Creativity</Label>
            <Description>
                Lower values give more predictable, focused answers.
                Higher values make responses more creative and varied.
            </Description>
            <SliderRow>
                <Slider
                    data-testid="temperature-slider"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={ settings.temperature }
                    onChange={ ( e ) => on_change( `temperature`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    data-testid="temperature-input"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={ settings.temperature }
                    onChange={ ( e ) => on_change( `temperature`, parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Max Tokens — moved from Basic */ }
        <Section>
            <Label>Response Length</Label>
            <Description>
                Maximum length of each response. Higher values allow longer answers
                but take more time to generate.
            </Description>
            <NumberInput
                data-testid="max-tokens-input"
                type="number"
                min="64"
                max="32768"
                step="64"
                value={ settings.max_tokens }
                onChange={ ( e ) => on_change( `max_tokens`, parseInt( e.target.value ) || 64 ) }
                style={ { width: `120px` } }
            />
        </Section>

        <Divider />
        <DividerLabel>Fine-tuning</DividerLabel>

        { /* Top P */ }
        <Section>
            <Label>Top P</Label>
            <Description>Limits the pool of words the AI picks from. Lower values keep it more focused.</Description>
            <SliderRow>
                <Slider
                    type="range" min="0" max="1" step="0.05"
                    value={ settings.top_p ?? 0.95 }
                    onChange={ ( e ) => on_change( `top_p`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    type="number" min="0" max="1" step="0.05"
                    value={ settings.top_p ?? 0.95 }
                    onChange={ ( e ) => on_change( `top_p`, parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Top K */ }
        <Section>
            <Label>Top K</Label>
            <Description>Only considers the top K most likely next words. Lower = more predictable.</Description>
            <NumberInput
                type="number" min="0" max="200"
                value={ settings.top_k ?? 40 }
                onChange={ ( e ) => on_change( `top_k`, parseInt( e.target.value ) || 0 ) }
                style={ { width: `100px` } }
            />
        </Section>

        { /* Min P */ }
        <Section>
            <Label>Min P</Label>
            <Description>Filters out words that are too unlikely. Higher values make output more predictable.</Description>
            <SliderRow>
                <Slider
                    type="range" min="0" max="1" step="0.01"
                    value={ settings.min_p ?? 0.05 }
                    onChange={ ( e ) => on_change( `min_p`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    type="number" min="0" max="1" step="0.01"
                    value={ settings.min_p ?? 0.05 }
                    onChange={ ( e ) => on_change( `min_p`, parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Repeat Penalty */ }
        <Section>
            <Label>Repeat Penalty</Label>
            <Description>Discourages the AI from repeating itself. Higher values = less repetition.</Description>
            <SliderRow>
                <Slider
                    type="range" min="1" max="2" step="0.05"
                    value={ settings.repeat_penalty ?? 1.1 }
                    onChange={ ( e ) => on_change( `repeat_penalty`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    type="number" min="1" max="2" step="0.05"
                    value={ settings.repeat_penalty ?? 1.1 }
                    onChange={ ( e ) => on_change( `repeat_penalty`, parseFloat( e.target.value ) || 1 ) }
                />
            </SliderRow>
        </Section>

        { /* Repeat Last N */ }
        <Section>
            <Label>Repeat Last N</Label>
            <Description>How far back the AI checks for repeated words.</Description>
            <NumberInput
                type="number" min="0" max="2048"
                value={ settings.repeat_last_n ?? 64 }
                onChange={ ( e ) => on_change( `repeat_last_n`, parseInt( e.target.value ) || 0 ) }
                style={ { width: `100px` } }
            />
        </Section>

        { /* Frequency Penalty */ }
        <Section>
            <Label>Frequency Penalty</Label>
            <Description>Reduces how often common words appear. Useful for more varied language.</Description>
            <SliderRow>
                <Slider
                    type="range" min="0" max="2" step="0.1"
                    value={ settings.frequency_penalty ?? 0 }
                    onChange={ ( e ) => on_change( `frequency_penalty`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    type="number" min="0" max="2" step="0.1"
                    value={ settings.frequency_penalty ?? 0 }
                    onChange={ ( e ) => on_change( `frequency_penalty`, parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Presence Penalty */ }
        <Section>
            <Label>Presence Penalty</Label>
            <Description>Encourages the AI to talk about new topics rather than repeating old ones.</Description>
            <SliderRow>
                <Slider
                    type="range" min="0" max="2" step="0.1"
                    value={ settings.presence_penalty ?? 0 }
                    onChange={ ( e ) => on_change( `presence_penalty`, parseFloat( e.target.value ) ) }
                />
                <NumberInput
                    type="number" min="0" max="2" step="0.1"
                    value={ settings.presence_penalty ?? 0 }
                    onChange={ ( e ) => on_change( `presence_penalty`, parseFloat( e.target.value ) || 0 ) }
                />
            </SliderRow>
        </Section>

        { /* Seed */ }
        <Section>
            <Label>Seed</Label>
            <Description>Set a number for reproducible results. Leave at -1 for random.</Description>
            <NumberInput
                type="number" min="-1"
                value={ settings.seed ?? -1 }
                onChange={ ( e ) => on_change( `seed`, parseInt( e.target.value ) || -1 ) }
                style={ { width: `120px` } }
            />
        </Section>

        { /* Stop Sequences */ }
        <Section>
            <Label>Stop Sequences</Label>
            <Description>Words or phrases that tell the AI to stop generating. Separate with commas.</Description>
            <TextInput
                type="text"
                placeholder="e.g. [END], STOP, ###"
                value={ settings.stop_sequences ?? `` }
                onChange={ ( e ) => on_change( `stop_sequences`, e.target.value ) }
            />
        </Section>

    </>

}
