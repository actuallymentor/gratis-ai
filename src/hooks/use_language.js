import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { storage_key } from '../utils/branding'

const STORAGE_KEY = storage_key( `language` )

/**
 * Hook for language management with persistence.
 * Wraps react-i18next's useTranslation with localStorage persistence.
 * Follows the same pattern as use_theme.js.
 *
 * @param {string} [namespace] - Optional i18next namespace
 * @returns {{ t: Function, language: string, set_language: Function }}
 */
export default function use_language( namespace ) {

    const { t, i18n } = useTranslation( namespace )

    const set_language = useCallback( ( code ) => {

        i18n.changeLanguage( code )

        try {
            localStorage.setItem( STORAGE_KEY, code )
        } catch {
            // localStorage unavailable
        }

    }, [ i18n ] )

    return { t, language: i18n.language, set_language }

}
