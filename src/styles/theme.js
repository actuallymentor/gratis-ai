// Shared tokens (spacing, fonts, radii) are theme-independent
const shared = {
    spacing: {
        xs: `4px`,
        sm: `8px`,
        md: `16px`,
        lg: `24px`,
        xl: `32px`,
        xxl: `48px`,
    },
    border_radius: {
        sm: `4px`,
        md: `8px`,
        lg: `12px`,
        xl: `16px`,
        full: `9999px`,
    },
    fonts: {
        body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        mono: `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`,
    },
    breakpoints: {
        mobile: `768px`,
        tablet: `1024px`,
    },
}

// Dark palette
const dark_colors = {
    background: `#1a1a2e`,
    surface: `#16213e`,
    surface_hover: `#1e2a4a`,
    sidebar: `#0f1626`,
    primary: `#4f8ff7`,
    primary_hover: `#3a7ae0`,
    text: `#e0e0e0`,
    text_secondary: `#8a8a9a`,
    text_muted: `#5a5a6a`,
    user_bubble: `#2a3a5c`,
    assistant_bubble: `#1e2a3a`,
    border: `#2a2a3e`,
    error: `#ff4757`,
    success: `#2ed573`,
    warning: `#ffa502`,
    input_background: `#0f1626`,
    code_background: `#0d1117`,
    modal_overlay: `rgba(0, 0, 0, 0.6)`,
}

// Light palette
const light_colors = {
    background: `#f8f9fa`,
    surface: `#ffffff`,
    surface_hover: `#f0f1f3`,
    sidebar: `#eef0f2`,
    primary: `#2563eb`,
    primary_hover: `#1d4ed8`,
    text: `#1a1a2e`,
    text_secondary: `#5a5a6a`,
    text_muted: `#9a9aaa`,
    user_bubble: `#e8eef7`,
    assistant_bubble: `#f0f2f5`,
    border: `#d8dbe0`,
    error: `#dc2626`,
    success: `#16a34a`,
    warning: `#d97706`,
    input_background: `#ffffff`,
    code_background: `#f6f8fa`,
    modal_overlay: `rgba(0, 0, 0, 0.3)`,
}

export const dark_theme = { ...shared, colors: dark_colors, mode: `dark` }
export const light_theme = { ...shared, colors: light_colors, mode: `light` }
