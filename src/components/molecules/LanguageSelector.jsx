import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { Globe, Check } from 'lucide-react'
import use_language from '../../hooks/use_language'

const Container = styled.div`
    position: relative;
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

const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    min-width: 160px;
    background: ${ ( { theme } ) => theme.colors.background };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    border-radius: ${ ( { theme } ) => theme.border_radius.lg };
    box-shadow: ${ ( { theme } ) => theme.mode === `dark`
        ? `0 2px 8px rgba( 0, 0, 0, 0.3 )`
        : `0 2px 8px rgba( 0, 0, 0, 0.08 )` };
    z-index: 500;
    overflow: hidden;
`

const LanguageOption = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    width: 100%;
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    text-align: left;
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text };
    transition: background 0.15s;
    min-height: 2.75rem;

    &:hover {
        background: ${ ( { theme } ) => theme.colors.surface_hover };
    }
`

const CheckSpace = styled.div`
    width: 14px;
    flex-shrink: 0;
`

// Extensible — add more languages here when translations are ready
const LANGUAGES = [
    { code: `en`, label: `English` },
]

/**
 * Globe icon dropdown for selecting the app language.
 * Follows the same dropdown pattern as ModelSelector.
 * @returns {JSX.Element}
 */
export default function LanguageSelector() {

    const [ is_open, set_is_open ] = useState( false )
    const container_ref = useRef( null )
    const { t, language, set_language } = use_language()

    // Close on click outside or Escape key
    useEffect( () => {

        if( !is_open ) return

        const handle_click = ( e ) => {
            if( container_ref.current && !container_ref.current.contains( e.target ) ) {
                set_is_open( false )
            }
        }

        const handle_keydown = ( e ) => {
            if( e.key === `Escape` ) {
                e.stopPropagation()
                set_is_open( false )
            }
        }

        document.addEventListener( `mousedown`, handle_click )
        document.addEventListener( `keydown`, handle_keydown, true )
        return () => {
            document.removeEventListener( `mousedown`, handle_click )
            document.removeEventListener( `keydown`, handle_keydown, true )
        }

    }, [ is_open ] )

    const handle_select = ( code ) => {
        set_language( code )
        set_is_open( false )
    }

    return <Container ref={ container_ref }>

        <IconButton
            data-testid="language-selector"
            onClick={ () => set_is_open( !is_open ) }
            aria-label={ t( `common:aria_change_language` ) }
        >
            <Globe size={ 18 } />
        </IconButton>

        { is_open && <Dropdown>
            { LANGUAGES.map( ( { code, label } ) =>
                <LanguageOption
                    key={ code }
                    onClick={ () => handle_select( code ) }
                >
                    { code === language
                        ? <Check size={ 14 } style={ { flexShrink: 0 } } />
                        : <CheckSpace /> }
                    { label }
                </LanguageOption>
            ) }
        </Dropdown> }

    </Container>

}
