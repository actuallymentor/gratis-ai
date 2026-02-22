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
    surface_hover: `#f3f6f7`,
    sidebar: `#f8fafa`,
    primary: `#1a1a1a`,
    primary_hover: `#3a3a3a`,
    accent: `#67a6b6`,
    accent_hover: `#5692a2`,
    text: `#1a1a1a`,
    text_secondary: `#6b7280`,
    text_muted: `#9ca3af`,
    user_bubble: `transparent`,
    assistant_bubble: `transparent`,
    border: `#e2e6e8`,
    border_subtle: `#eef1f2`,
    error: `#b85c5c`,
    success: `#5e9e72`,
    warning: `#c49660`,
    input_background: `#f8fafa`,
    code_background: `#f3f6f7`,
    modal_overlay: `rgba( 0, 0, 0, 0.4 )`,
}

// Dark palette — ink on black
const dark_colors = {
    background: `#0a0a0a`,
    surface: `#0a0a0a`,
    surface_hover: `#1a1a1a`,
    sidebar: `#0f0f0f`,
    primary: `#e8ecee`,
    primary_hover: `#c0c8cc`,
    accent: `#7ec0d0`,
    accent_hover: `#6baebb`,
    text: `#e0e4e6`,
    text_secondary: `#8a9199`,
    text_muted: `#5c6369`,
    user_bubble: `transparent`,
    assistant_bubble: `transparent`,
    border: `#1e2426`,
    border_subtle: `#171c1e`,
    error: `#d47878`,
    success: `#72b886`,
    warning: `#d4a76a`,
    input_background: `#111314`,
    code_background: `#131617`,
    modal_overlay: `rgba( 0, 0, 0, 0.6 )`,
}

export const dark_theme = { ...shared, colors: dark_colors, mode: `dark` }
export const light_theme = { ...shared, colors: light_colors, mode: `light` }
