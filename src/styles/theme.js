// Shared tokens (spacing, fonts, radii) are theme-independent
const shared = {
    spacing: {
        xs: `0.25rem`,    // 4px
        sm: `0.5rem`,     // 8px
        md: `1rem`,       // 16px
        lg: `1.5rem`,     // 24px
        xl: `2rem`,       // 32px
        xxl: `3rem`,      // 48px
    },
    border_radius: {
        sm: `0.25rem`,    // subtle rounding
        md: `0.5rem`,     // default
        lg: `0.75rem`,    // cards/modals
        xl: `1rem`,       // large elements
        full: `9999px`,   // pills
    },
    fonts: {
        body: `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`,
        mono: `'SF Mono', ui-monospace, 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, monospace`,
    },
    breakpoints: {
        mobile: `768px`,
        tablet: `1024px`,
    },
}

// Light palette — minimal, paper-like
const light_colors = {
    background: `#ffffff`,
    surface: `#ffffff`,
    surface_hover: `#f5f5f5`,
    sidebar: `#fafafa`,
    primary: `#111111`,
    primary_hover: `#333333`,
    accent: `#2563eb`,
    accent_hover: `#1d4ed8`,
    text: `#111111`,
    text_secondary: `#666666`,
    text_muted: `#999999`,
    user_bubble: `transparent`,
    assistant_bubble: `transparent`,
    border: `#e5e5e5`,
    border_subtle: `#f0f0f0`,
    error: `#dc2626`,
    success: `#16a34a`,
    warning: `#d97706`,
    input_background: `#fafafa`,
    code_background: `#f5f5f5`,
    modal_overlay: `rgba( 0, 0, 0, 0.4 )`,
}

// Dark palette — ink on black
const dark_colors = {
    background: `#0a0a0a`,
    surface: `#0a0a0a`,
    surface_hover: `#1a1a1a`,
    sidebar: `#0f0f0f`,
    primary: `#f0f0f0`,
    primary_hover: `#cccccc`,
    accent: `#6cacff`,
    accent_hover: `#5a9aee`,
    text: `#e8e8e8`,
    text_secondary: `#999999`,
    text_muted: `#666666`,
    user_bubble: `transparent`,
    assistant_bubble: `transparent`,
    border: `#222222`,
    border_subtle: `#1a1a1a`,
    error: `#ff4757`,
    success: `#2ed573`,
    warning: `#ffa502`,
    input_background: `#111111`,
    code_background: `#151515`,
    modal_overlay: `rgba( 0, 0, 0, 0.6 )`,
}

export const dark_theme = { ...shared, colors: dark_colors, mode: `dark` }
export const light_theme = { ...shared, colors: light_colors, mode: `light` }
