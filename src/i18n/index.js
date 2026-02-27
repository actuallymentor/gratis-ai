/**
 * i18n initialisation — sets up i18next with bundled English translations.
 *
 * Language detection: localStorage → navigator.languages → 'en' fallback.
 * No async loading needed — all translations are bundled for the single
 * shipped language. Adding more languages later just means importing
 * another JSON set and adding it to the resources object.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { storage_key } from '../utils/branding'

// Bundled namespace translations
import common from './locales/en/common.json'
import chat from './locales/en/chat.json'
import settings from './locales/en/settings.json'
import models from './locales/en/models.json'
import pages from './locales/en/pages.json'

const STORAGE_KEY = storage_key( `language` )

// Detect preferred language: stored preference → browser → fallback
const detect_language = () => {

    try {
        const stored = localStorage.getItem( STORAGE_KEY )
        if( stored ) return stored
    } catch {
        // localStorage unavailable
    }

    // Use the first browser language that we have translations for
    const browser_languages = navigator.languages || [ navigator.language ]
    for( const lang of browser_languages ) {
        const code = lang.split( `-` )[ 0 ]
        if( code === `en` ) return `en`
    }

    return `en`

}

i18n.use( initReactI18next ).init( {

    resources: {
        en: { common, chat, settings, models, pages },
    },

    lng: detect_language(),
    fallbackLng: `en`,
    defaultNS: `common`,

    interpolation: {
        escapeValue: false,
    },

    react: {
        useSuspense: false,
    },

} )

/**
 * Fetch the system locale from Electron and switch if available.
 * No-op in browser environments.
 * @returns {Promise<void>}
 */
export const sync_electron_locale = async () => {

    try {

        const locale = await window.electronAPI?.get_system_locale?.()
        if( !locale ) return

        // Only switch if the user hasn't explicitly set a language
        const stored = localStorage.getItem( STORAGE_KEY )
        if( stored ) return

        const code = locale.split( `-` )[ 0 ]
        if( i18n.hasResourceBundle( code, `common` ) ) {
            await i18n.changeLanguage( code )
        }

    } catch {
        // Electron API unavailable or locale detection failed
    }

}

export default i18n
