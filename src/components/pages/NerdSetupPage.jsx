/**
 * Nerd Mode setup wizard — deploy a HuggingFace model on RunPod cloud GPUs.
 *
 * Flow:
 *   1. Enter RunPod API key
 *   2. Type a model name (or browse suggested models)
 *   3. Auto-fetches config.json from HuggingFace → calculates VRAM → suggests GPU
 *   4. (Optional) Advanced: override GPU, idle timeout, quantization, etc.
 *   5. Deploy → creates template + endpoint → navigates to /chat
 */
import { useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Cloud, ChevronDown, ChevronUp, LoaderCircle, AlertTriangle, Check, ArrowRight, List } from 'lucide-react'
import use_runpod_store from '../../stores/runpod_store'
import {
    create_template,
    create_endpoint,
    fetch_model_config,
    estimate_vram_gb,
    suggest_gpu,
    get_all_gpus_annotated,
    GPU_POOLS,
} from '../../providers/runpod_service'
import { storage_key } from '../../utils/branding'
import SuggestedModelsModal from '../molecules/SuggestedModelsModal'


// ─── Styled components ───────────────────────────────────────────────────────

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-height: 0;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    overflow-y: auto;

    &::before, &::after {
        content: '';
        flex: 1 0 0px;
    }
`

const Title = styled.h1`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    font-size: clamp( 1.5rem, 1.2rem + 1.5vw, 2rem );
    color: ${ ( { theme } ) => theme.colors.text };
    border-bottom: 3px solid ${ ( { theme } ) => theme.colors.info };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const Subtitle = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
    max-width: 520px;
    line-height: 1.5;
`

const FormCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.md };
    width: 100%;
    max-width: 480px;
`

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const Label = styled.label`
    font-size: 0.85rem;
    font-weight: 500;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

const Input = styled.input`
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    width: 100%;

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.info }; }
`

const TextArea = styled.textarea`
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    width: 100%;
    min-height: 80px;
    resize: vertical;
    font-family: inherit;

    &::placeholder { color: ${ ( { theme } ) => theme.colors.text_muted }; }
    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.info }; }
`

const Select = styled.select`
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    font-size: 0.85rem;
    background: ${ ( { theme } ) => theme.colors.input_background };
    color: ${ ( { theme } ) => theme.colors.text };
    width: 100%;

    &:focus { outline: none; border-color: ${ ( { theme } ) => theme.colors.info }; }
`

const Hint = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    line-height: 1.4;
`

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { $error, theme } ) => $error ? theme.colors.error : theme.colors.text_muted };
`

const GpuBadge = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.info };
    font-weight: 500;
    padding: ${ ( { theme } ) => theme.spacing.sm };
    border: 1px solid ${ ( { theme } ) => theme.colors.info }40;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    background: ${ ( { theme } ) => theme.colors.info }10;
`

const BrowseButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.info };
    transition: opacity 0.15s;
    min-height: 2.75rem;

    &:hover { opacity: 0.7; }
`

const AdvancedToggle = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    transition: color 0.15s;
    min-height: 2.75rem;

    &:hover { color: ${ ( { theme } ) => theme.colors.text_secondary }; }
`

const AdvancedPanel = styled.div`
    overflow: hidden;
    max-height: ${ ( { $open } ) => $open ? `800px` : `0px` };
    opacity: ${ ( { $open } ) => $open ? 1 : 0 };
    transition: max-height 0.3s ease, opacity 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: ${ ( { theme } ) => theme.spacing.md };

    @media ( prefers-reduced-motion: reduce ) { transition: none; }
`

const DeployButton = styled.button`
    background: ${ ( { theme } ) => theme.colors.info };
    color: white;
    padding: ${ ( { theme } ) => `${ theme.spacing.md } ${ theme.spacing.xl }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    font-size: 1rem;
    font-weight: 600;
    margin-top: ${ ( { theme } ) => theme.spacing.md };
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    min-height: 2.75rem;

    &:hover:not(:disabled) { opacity: 0.85; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const Spinner = styled( LoaderCircle )`
    animation: spin 1s linear infinite;
    @keyframes spin { to { transform: rotate( 360deg ); } }
`

const StepIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    margin-top: ${ ( { theme } ) => theme.spacing.lg };
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
`

const StepDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    background: ${ ( { theme, $active, $done } ) =>
        $done ? theme.colors.info
            : $active ? theme.colors.info
                : theme.colors.border };
`

const StepLine = styled.div`
    width: 24px;
    height: 2px;
    background: ${ ( { theme, $done } ) => $done ? theme.colors.info : theme.colors.border };
`

const SliderRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
`

const SliderValue = styled.span`
    font-size: 0.8rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    min-width: 48px;
    text-align: right;
`

const RangeInput = styled.input`
    flex: 1;
    accent-color: ${ ( { theme } ) => theme.colors.info };
`

const InputRow = styled.div`
    display: flex;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    align-items: center;
`

const SmallInput = styled( Input )`
    width: 80px;
    text-align: center;
`


// ─── Component ───────────────────────────────────────────────────────────────

export default function NerdSetupPage() {

    const navigate = useNavigate()
    const { t } = useTranslation( `nerd` )

    // Nerd Mode requires Electron (Node.js bypasses CORS for RunPod API calls)
    useEffect( () => {
        if( !window.electronAPI ) navigate( `/model-select`, { replace: true } )
    }, [ navigate ] )

    // Store
    const store = use_runpod_store()

    // Form state
    const [ api_key, set_api_key ] = useState( store.api_key )
    const [ model_name, set_model_name ] = useState( `` )
    const [ show_suggested, set_show_suggested ] = useState( false )
    const [ show_advanced, set_show_advanced ] = useState( false )

    // Model validation state
    const [ model_config, set_model_config ] = useState( null )
    const [ model_loading, set_model_loading ] = useState( false )
    const [ model_error, set_model_error ] = useState( null )

    // GPU state
    const [ vram_needed, set_vram_needed ] = useState( 0 )
    const [ suggested_gpu, set_suggested_gpu ] = useState( null )
    const [ gpu_override, set_gpu_override ] = useState( `` )

    // Advanced state
    const [ quantization, set_quantization ] = useState( `fp16` )
    const [ max_model_len, set_max_model_len ] = useState( `` )
    const [ gpu_utilization, set_gpu_utilization ] = useState( 0.95 )
    const [ idle_timeout, set_idle_timeout ] = useState( store.idle_timeout )
    const [ daily_limit, set_daily_limit ] = useState( store.daily_spend_limit )
    const [ system_prompt, set_system_prompt ] = useState(
        store.system_prompt || import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT || ``
    )

    // Deploy state
    const [ deploying, set_deploying ] = useState( false )
    const [ deploy_error, set_deploy_error ] = useState( null )


    /**
     * Validate a model name — fetch config.json from HuggingFace,
     * compute VRAM estimate, and suggest a GPU.
     */
    const validate_model = useCallback( async ( name ) => {

        if( !name.trim() || !name.includes( `/` ) ) return

        set_model_loading( true )
        set_model_error( null )
        set_model_config( null )
        set_suggested_gpu( null )

        try {

            const config = await fetch_model_config( name.trim() )
            set_model_config( config )

            // Estimate VRAM
            const ctx = max_model_len ? parseInt( max_model_len ) : undefined
            const vram = estimate_vram_gb( config, quantization, ctx )
            set_vram_needed( vram )

            // Suggest cheapest GPU that fits
            const suggestion = suggest_gpu( vram )
            set_suggested_gpu( suggestion )

        } catch ( err ) {
            set_model_error( err.message )
        } finally {
            set_model_loading( false )
        }

    }, [ quantization, max_model_len ] )


    /**
     * Handle model input blur/enter — trigger validation.
     */
    const handle_model_blur = () => validate_model( model_name )

    const handle_model_keydown = ( e ) => {
        if( e.key === `Enter` ) {
            e.preventDefault()
            validate_model( model_name )
        }
    }


    /**
     * Handle suggested model selection from the modal.
     */
    const handle_suggested_select = ( hf_repo ) => {
        set_model_name( hf_repo )
        validate_model( hf_repo )
    }


    /**
     * Deploy: create template + endpoint → save to store → navigate to /chat.
     */
    const handle_deploy = async () => {

        if( !api_key.trim() || !model_name.trim() ) return

        set_deploying( true )
        set_deploy_error( null )

        try {

            // Determine which GPU to use
            const gpu_id = gpu_override || suggested_gpu?.pool?.id || GPU_POOLS[ 0 ].id
            const gpu_pool = GPU_POOLS.find( p => p.id === gpu_id ) || GPU_POOLS[ 0 ]

            // 1. Create template with model config
            const template = await create_template( api_key.trim(), {
                model_name: model_name.trim(),
                quantization: quantization !== `fp16` ? quantization : undefined,
                max_model_len: max_model_len ? parseInt( max_model_len ) : undefined,
                gpu_memory_utilization: gpu_utilization,
            } )

            // 2. Create endpoint referencing the template
            const display_name = model_name.split( `/` ).pop().toLowerCase()
            const endpoint = await create_endpoint( api_key.trim(), {
                template_id: template.id,
                name: `gratisai-${ display_name }`,
                gpu_ids: gpu_pool.gpu_ids,
                idle_timeout,
            } )

            // 3. Save to store
            store.set_api_key( api_key.trim() )
            store.set_idle_timeout( idle_timeout )
            store.set_daily_spend_limit( daily_limit )
            store.set_system_prompt( system_prompt )

            store.add_endpoint( {
                id: `runpod-${ endpoint.id }`,
                endpoint_id: endpoint.id,
                template_id: template.id,
                model_name: model_name.trim(),
                gpu_id,
                gpu_name: gpu_pool.name,
                price_per_hr: suggested_gpu?.price_per_hr || 0,
                name: display_name,
                created_at: Date.now(),
            } )

            // 4. Set as active model and navigate to chat
            const model_id = `runpod:${ endpoint.id }`
            localStorage.setItem( storage_key( `active_model_id` ), model_id )
            navigate( `/chat` )

        } catch ( err ) {
            set_deploy_error( err.message )
        } finally {
            set_deploying( false )
        }

    }


    // Resolve available GPUs for the override dropdown
    const all_gpus = get_all_gpus_annotated( vram_needed )
    const can_deploy = api_key.trim() && model_name.trim() && !deploying

    return <Container>

        <Title><Cloud size={ 24 } /> { t( `page_title` ) }</Title>
        <Subtitle>{ t( `page_subtitle` ) }</Subtitle>

        <FormCard>

            { /* ── API Key ── */ }
            <FieldGroup>
                <Label>{ t( `api_key_label` ) }</Label>
                <Input
                    type="password"
                    data-testid="runpod-api-key"
                    placeholder={ t( `api_key_placeholder` ) }
                    value={ api_key }
                    onChange={ ( e ) => set_api_key( e.target.value ) }
                />
                <Hint>{ t( `api_key_hint` ) }</Hint>
            </FieldGroup>

            { /* ── Model Name ── */ }
            <FieldGroup>
                <Label>{ t( `model_name_label` ) }</Label>
                <Input
                    type="text"
                    data-testid="runpod-model-name"
                    placeholder={ t( `model_name_placeholder` ) }
                    value={ model_name }
                    onChange={ ( e ) => set_model_name( e.target.value ) }
                    onBlur={ handle_model_blur }
                    onKeyDown={ handle_model_keydown }
                />

                <BrowseButton
                    data-testid="browse-suggested-models"
                    onClick={ () => set_show_suggested( true ) }
                >
                    <List size={ 14 } />
                    { t( `browse_suggested` ) }
                </BrowseButton>

                { /* Model validation status */ }
                { model_loading && <StatusRow>
                    <Spinner size={ 12 } /> { t( `validating_model` ) }
                </StatusRow> }

                { model_error && <StatusRow $error>
                    <AlertTriangle size={ 12 } /> { model_error }
                </StatusRow> }

                { model_config && !model_loading && <StatusRow>
                    <Check size={ 12 } /> { t( `model_validated`, {
                        params: model_config.num_params
                            ? ( model_config.num_params / 1e9 ).toFixed( 1 ) + `B`
                            : `unknown`,
                        type: model_config.model_type,
                    } ) }
                </StatusRow> }
            </FieldGroup>

            { /* ── Suggested GPU ── */ }
            { suggested_gpu && <GpuBadge data-testid="suggested-gpu">
                <Cloud size={ 14 } />
                { t( `gpu_auto`, { name: suggested_gpu.pool.name, vram: suggested_gpu.pool.vram_gb } ) }
                { suggested_gpu.price_per_hr != null && ` — ${ t( `gpu_cost`, { cost: suggested_gpu.price_per_hr.toFixed( 2 ) } ) }` }
            </GpuBadge> }

            { vram_needed > 0 && <Hint>
                { t( `estimated_vram`, { vram: vram_needed.toFixed( 1 ) } ) }
            </Hint> }

            { model_config && !suggested_gpu && vram_needed > 0 && <StatusRow $error>
                <AlertTriangle size={ 12 } /> { t( `gpu_no_fit` ) }
            </StatusRow> }


            { /* ── Advanced ── */ }
            <AdvancedToggle onClick={ () => set_show_advanced( !show_advanced ) }>
                { t( `advanced_title` ) }
                { show_advanced ? <ChevronUp size={ 14 } /> : <ChevronDown size={ 14 } /> }
            </AdvancedToggle>

            <AdvancedPanel $open={ show_advanced }>

                { /* GPU override */ }
                <FieldGroup>
                    <Label>{ t( `gpu_override_label` ) }</Label>
                    <Select
                        data-testid="gpu-override"
                        value={ gpu_override }
                        onChange={ ( e ) => set_gpu_override( e.target.value ) }
                    >
                        <option value="">{ suggested_gpu ? `Auto (${ suggested_gpu.pool.name })` : `Auto` }</option>
                        { all_gpus.map( ( { pool, fits, price_per_hr } ) =>
                            <option key={ pool.id } value={ pool.id } disabled={ !fits }>
                                { pool.name }
                                { price_per_hr != null ? ` — $${ price_per_hr.toFixed( 2 ) }/hr` : `` }
                                { !fits ? ` (${ t( `gpu_insufficient_vram` ) })` : `` }
                            </option>
                        ) }
                    </Select>
                </FieldGroup>

                { /* Quantization */ }
                <FieldGroup>
                    <Label>{ t( `quantization_label` ) }</Label>
                    <Select
                        value={ quantization }
                        onChange={ ( e ) => {
                            set_quantization( e.target.value )
                            // Re-validate with new quantization
                            if( model_config ) validate_model( model_name )
                        } }
                    >
                        <option value="fp16">{ t( `quantization_default` ) }</option>
                        <option value="fp8">FP8</option>
                        <option value="awq">AWQ</option>
                        <option value="gptq">GPTQ</option>
                    </Select>
                </FieldGroup>

                { /* Max context length */ }
                <FieldGroup>
                    <Label>{ t( `max_model_len_label` ) }</Label>
                    <Input
                        type="number"
                        placeholder={ t( `max_model_len_placeholder` ) }
                        value={ max_model_len }
                        onChange={ ( e ) => set_max_model_len( e.target.value ) }
                    />
                </FieldGroup>

                { /* GPU memory utilization */ }
                <FieldGroup>
                    <Label>{ t( `gpu_utilization_label` ) }</Label>
                    <SliderRow>
                        <RangeInput
                            type="range"
                            min="0.5"
                            max="0.99"
                            step="0.01"
                            value={ gpu_utilization }
                            onChange={ ( e ) => set_gpu_utilization( parseFloat( e.target.value ) ) }
                        />
                        <SliderValue>{ ( gpu_utilization * 100 ).toFixed( 0 ) }%</SliderValue>
                    </SliderRow>
                </FieldGroup>

                { /* Idle timeout */ }
                <FieldGroup>
                    <Label>{ t( `idle_timeout_label` ) }</Label>
                    <SliderRow>
                        <RangeInput
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={ idle_timeout }
                            onChange={ ( e ) => set_idle_timeout( parseInt( e.target.value ) ) }
                        />
                        <SliderValue>{ t( `idle_timeout_value`, { minutes: idle_timeout } ) }</SliderValue>
                    </SliderRow>
                </FieldGroup>

                { /* Daily spend limit */ }
                <FieldGroup>
                    <Label>{ t( `daily_limit_label` ) }</Label>
                    <InputRow>
                        <SmallInput
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={ daily_limit }
                            onChange={ ( e ) => set_daily_limit( parseFloat( e.target.value ) || 2 ) }
                        />
                        <Hint>USD per day</Hint>
                    </InputRow>
                </FieldGroup>

                { /* System prompt */ }
                <FieldGroup>
                    <Label>{ t( `system_prompt_label` ) }</Label>
                    <TextArea
                        placeholder={ import.meta.env.VITE_DEFAULT_SYSTEM_PROMPT || `` }
                        value={ system_prompt }
                        onChange={ ( e ) => set_system_prompt( e.target.value ) }
                    />
                </FieldGroup>

            </AdvancedPanel>


            { /* ── Deploy button ── */ }
            <DeployButton
                data-testid="deploy-endpoint-btn"
                onClick={ handle_deploy }
                disabled={ !can_deploy }
            >
                { deploying
                    ? <><Spinner size={ 18 } /> { t( `deploying` ) }</>
                    : <> { t( `deploy_button` ) } <ArrowRight size={ 18 } /></> }
            </DeployButton>

            { deploy_error && <StatusRow $error>
                <AlertTriangle size={ 12 } /> { t( `deploy_error`, { error: deploy_error } ) }
            </StatusRow> }

        </FormCard>


        { /* Step progress */ }
        <StepIndicator data-testid="step-indicator">
            <StepDot $done />
            <StepLine $done />
            <StepDot $active />
            <StepLine />
            <StepDot />
        </StepIndicator>


        { /* Suggested models modal */ }
        <SuggestedModelsModal
            is_open={ show_suggested }
            on_close={ () => set_show_suggested( false ) }
            on_select={ handle_suggested_select }
            current_model={ model_name }
        />

    </Container>

}
