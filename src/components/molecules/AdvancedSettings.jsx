import styled from 'styled-components'
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

    const { t } = useTranslation( `settings` )

    return <>

        { /* Temperature — moved from Basic */ }
        <Section>
            <Label>{ t( `creativity` ) }</Label>
            <Description>
                { t( `creativity_description` ) }
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
            <Label>{ t( `response_length` ) }</Label>
            <Description>
                { t( `response_length_description` ) }
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
        <DividerLabel>{ t( `fine_tuning` ) }</DividerLabel>

        { /* Top P */ }
        <Section>
            <Label>{ t( `top_p` ) }</Label>
            <Description>{ t( `top_p_description` ) }</Description>
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
            <Label>{ t( `top_k` ) }</Label>
            <Description>{ t( `top_k_description` ) }</Description>
            <NumberInput
                type="number" min="0" max="200"
                value={ settings.top_k ?? 40 }
                onChange={ ( e ) => on_change( `top_k`, parseInt( e.target.value ) || 0 ) }
                style={ { width: `100px` } }
            />
        </Section>

        { /* Min P */ }
        <Section>
            <Label>{ t( `min_p` ) }</Label>
            <Description>{ t( `min_p_description` ) }</Description>
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
            <Label>{ t( `repeat_penalty` ) }</Label>
            <Description>{ t( `repeat_penalty_description` ) }</Description>
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
            <Label>{ t( `repeat_last_n` ) }</Label>
            <Description>{ t( `repeat_last_n_description` ) }</Description>
            <NumberInput
                type="number" min="0" max="2048"
                value={ settings.repeat_last_n ?? 64 }
                onChange={ ( e ) => on_change( `repeat_last_n`, parseInt( e.target.value ) || 0 ) }
                style={ { width: `100px` } }
            />
        </Section>

        { /* Frequency Penalty */ }
        <Section>
            <Label>{ t( `frequency_penalty` ) }</Label>
            <Description>{ t( `frequency_penalty_description` ) }</Description>
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
            <Label>{ t( `presence_penalty` ) }</Label>
            <Description>{ t( `presence_penalty_description` ) }</Description>
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
            <Label>{ t( `seed` ) }</Label>
            <Description>{ t( `seed_description` ) }</Description>
            <NumberInput
                type="number" min="-1"
                value={ settings.seed ?? -1 }
                onChange={ ( e ) => on_change( `seed`, parseInt( e.target.value ) || -1 ) }
                style={ { width: `120px` } }
            />
        </Section>

        { /* Stop Sequences */ }
        <Section>
            <Label>{ t( `stop_sequences` ) }</Label>
            <Description>{ t( `stop_sequences_description` ) }</Description>
            <TextInput
                type="text"
                placeholder={ t( `stop_sequences_placeholder` ) }
                value={ settings.stop_sequences ?? `` }
                onChange={ ( e ) => on_change( `stop_sequences`, e.target.value ) }
            />
        </Section>

    </>

}
