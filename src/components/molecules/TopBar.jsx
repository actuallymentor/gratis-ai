import styled from 'styled-components'
import { Sun, Moon, Monitor, Settings, PanelLeft, ArrowLeftRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ModelSelector from './ModelSelector'

const Bar = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.background };
    border-bottom: 1px solid ${ ( { theme } ) => theme.colors.border_subtle };
    height: 56px;
    flex-shrink: 0;
`

const LeftSection = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    flex: 1;
    min-width: 0;
`

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
`

const IconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    color: ${ ( { theme } ) => theme.colors.text_muted };
    transition: color 0.15s;

    &:hover {
        color: ${ ( { theme } ) => theme.colors.text };
    }
`

const ChangeModelButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } ${ theme.spacing.sm }` };
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    transition: color 0.15s;
    white-space: nowrap;

    &:hover { color: ${ ( { theme } ) => theme.colors.text_secondary }; }
`

// Cycle: system -> light -> dark -> system
const CYCLE = [ `system`, `light`, `dark` ]

/**
 * Returns the icon component matching the current theme state
 * @param {string} preference - Theme preference value
 * @param {string} mode - Resolved theme mode
 * @returns {JSX.Element}
 */
const get_theme_icon = ( preference, mode ) => {
    if( preference === `system` ) return <Monitor size={ 18 } />
    if( mode === `light` ) return <Sun size={ 18 } />
    return <Moon size={ 18 } />
}

/**
 * Top navigation bar with model selector, theme toggle, and settings
 * @param {Object} props
 * @param {string} props.theme_preference - Current theme preference
 * @param {string} props.theme_mode - Resolved theme mode
 * @param {Function} props.on_theme_toggle - Handler for theme cycling
 * @param {Function} props.on_settings_open - Handler for opening settings
 * @param {boolean} props.sidebar_collapsed - Whether sidebar is currently collapsed
 * @param {Function} props.on_toggle_sidebar - Handler for toggling sidebar visibility
 * @param {Array} props.cached_models - Array of cached model metadata
 * @param {string} props.active_model_id - Currently active model ID
 * @param {boolean} props.is_model_switching - Whether a model switch is in progress
 * @param {Function} props.on_model_switch - Handler for model switching
 * @returns {JSX.Element}
 */
export default function TopBar( {
    theme_preference,
    theme_mode,
    on_theme_toggle,
    on_settings_open,
    sidebar_collapsed,
    on_toggle_sidebar,
    cached_models,
    active_model_id,
    is_model_switching,
    on_model_switch,
} ) {

    const navigate = useNavigate()

    const cycle_theme = () => {
        const current_index = CYCLE.indexOf( theme_preference )
        const next = CYCLE[ ( current_index + 1 ) % CYCLE.length ]
        on_theme_toggle( next )
    }

    return <Bar>

        { /* Left: sidebar toggle + model selector + change model */ }
        <LeftSection>
            { sidebar_collapsed && <IconButton
                data-testid="sidebar-open-btn"
                onClick={ on_toggle_sidebar }
                aria-label="Open sidebar"
            >
                <PanelLeft size={ 18 } />
            </IconButton> }
            <ModelSelector
                cached_models={ cached_models }
                active_model_id={ active_model_id }
                is_switching={ is_model_switching }
                on_switch={ on_model_switch }
                on_open_settings={ on_settings_open }
            />
            <ChangeModelButton
                data-testid="change-model-btn"
                onClick={ () => navigate( `/select-model` ) }
                aria-label="Change model"
            >
                <ArrowLeftRight size={ 14 } />
                Change model
            </ChangeModelButton>
        </LeftSection>

        { /* Right: theme toggle + settings */ }
        <RightSection>
            <IconButton
                data-testid="theme-toggle"
                onClick={ cycle_theme }
                title={ `Theme: ${ theme_preference.charAt( 0 ).toUpperCase() + theme_preference.slice( 1 ) }` }
                aria-label="Toggle theme"
            >
                { get_theme_icon( theme_preference, theme_mode ) }
            </IconButton>

            <IconButton
                data-testid="settings-btn"
                onClick={ on_settings_open }
                aria-label="Open settings"
            >
                <Settings size={ 18 } />
            </IconButton>
        </RightSection>

    </Bar>

}
