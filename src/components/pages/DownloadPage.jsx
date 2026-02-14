import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'
import { useNavigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { download_model, is_model_cached } from '../../utils/model_download'
import { format_file_size } from '../../providers/model_registry'

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${ ( { theme } ) => theme.spacing.xl };
    text-align: center;
`

const Title = styled.h1`
    font-size: 2rem;
    margin-bottom: ${ ( { theme } ) => theme.spacing.sm };
`

const ModelName = styled.p`
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.lg };
`

const ProgressContainer = styled.div`
    width: 100%;
    max-width: 400px;
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const ProgressBar = styled.div`
    width: 100%;
    height: 12px;
    background: ${ ( { theme } ) => theme.colors.surface };
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    overflow: hidden;
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
`

const ProgressFill = styled.div`
    height: 100%;
    background: ${ ( { theme } ) => theme.colors.primary };
    border-radius: ${ ( { theme } ) => theme.border_radius.full };
    transition: width 0.3s ease;
    width: ${ ( { $progress } ) => `${ $progress * 100 }%` };
`

const ProgressText = styled.p`
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    margin-top: ${ ( { theme } ) => theme.spacing.sm };
`

const StatusText = styled.p`
    font-size: 0.9rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

const CancelButton = styled.button`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.xs };
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
    color: ${ ( { theme } ) => theme.colors.text_secondary };
    transition: all 0.2s;

    &:hover {
        border-color: ${ ( { theme } ) => theme.colors.error };
        color: ${ ( { theme } ) => theme.colors.error };
    }
`

const ErrorText = styled.p`
    color: ${ ( { theme } ) => theme.colors.error };
    margin-bottom: ${ ( { theme } ) => theme.spacing.md };
`

/**
 * Download page - shows model download progress
 * @returns {JSX.Element}
 */
export default function DownloadPage() {

    const navigate = useNavigate()
    const location = useLocation()
    const model = location.state?.model
    const return_to = location.state?.return_to || `/chat`

    const [ progress, set_progress ] = useState( { progress: 0, bytes_loaded: 0, bytes_total: 0, status: `Preparing...` } )
    const [ error, set_error ] = useState( null )
    const abort_ref = useRef( null )

    const on_complete = useCallback( () => {

        // Save active model ID to localStorage
        if( model ) {
            localStorage.setItem( `locallm:settings:active_model_id`, model.id )
        }
        navigate( return_to, { replace: true } )

    }, [ model, navigate, return_to ] )

    useEffect( () => {

        if( !model ) {
            navigate( `/select-model`, { replace: true } )
            return
        }

        // Check if already cached
        is_model_cached( model.id ).then( cached => {

            if( cached ) {
                on_complete()
                return
            }

            // Start download
            const controller = new AbortController()
            abort_ref.current = controller

            download_model( model, set_progress, controller.signal )
                .then( on_complete )
                .catch( err => {
                    if( err.name !== `AbortError` ) {
                        set_error( err.message )
                    }
                } )

        } )

        return () => {
            if( abort_ref.current ) abort_ref.current.abort()
        }

    }, [ model, navigate, on_complete ] )

    const handle_cancel = () => {
        if( abort_ref.current ) abort_ref.current.abort()
        navigate( `/select-model`, { replace: true } )
    }

    if( !model ) return null

    return <Container>

        <Title>Downloading Model</Title>
        <ModelName>{ model.name } ({ format_file_size( model.file_size_bytes ) })</ModelName>

        { error && <ErrorText>{ error }</ErrorText> }

        <ProgressContainer>
            <ProgressBar data-testid="download-progress-bar">
                <ProgressFill $progress={ progress.progress } />
            </ProgressBar>
            <ProgressText>
                { format_file_size( progress.bytes_loaded ) } / { format_file_size( progress.bytes_total ) }
                { ` — ` }
                { Math.round( progress.progress * 100 ) }%
            </ProgressText>
        </ProgressContainer>

        <StatusText>{ progress.status }</StatusText>

        <CancelButton onClick={ handle_cancel }>
            <X size={ 16 } />
            Cancel
        </CancelButton>

    </Container>

}
