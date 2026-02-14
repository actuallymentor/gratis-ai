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

/**
 * Advanced settings tab content
 * @param {Object} props
 * @param {Object} props.settings - Current settings values
 * @param {Function} props.on_change - Handler for setting changes (key, value)
 * @returns {JSX.Element}
 */
export default function AdvancedSettings( { settings, on_change } ) {

    return <>

        { /* Top P */ }
        <Section>
            <Label>Top P</Label>
            <Description>Nucleus sampling: only consider top P% of probability mass.</Description>
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
            <Description>Only sample from the top K most likely tokens.</Description>
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
            <Description>Minimum probability threshold for token sampling.</Description>
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
            <Description>Penalises repeated tokens. Higher = less repetition.</Description>
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
            <Description>Number of recent tokens to consider for repeat penalty.</Description>
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
            <Description>Penalises tokens based on how often they appear.</Description>
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
            <Description>Penalises tokens that have appeared at all.</Description>
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
            <Description>-1 for random. Set a positive integer for deterministic output.</Description>
            <NumberInput
                type="number" min="-1"
                value={ settings.seed ?? -1 }
                onChange={ ( e ) => on_change( `seed`, parseInt( e.target.value ) || -1 ) }
                style={ { width: `120px` } }
            />
        </Section>

    </>

}
