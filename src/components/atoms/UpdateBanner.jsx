import styled from 'styled-components'
import { Download, RefreshCw, X } from 'lucide-react'

const Banner = styled.div`
    display: flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.sm };
    padding: ${ p => p.theme.spacing.xs } ${ p => p.theme.spacing.md };
    background: ${ p => p.theme.colors.accent };
    color: #fff;
    font-size: 0.8125rem;
    line-height: 1.4;
    min-height: 2rem;
`

const Message = styled.span`
    flex: 1;
`

const ActionButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: ${ p => p.theme.spacing.xs };
    padding: 0.15rem ${ p => p.theme.spacing.sm };
    background: rgba( 255, 255, 255, 0.2 );
    color: #fff;
    border: none;
    border-radius: ${ p => p.theme.border_radius.sm };
    font-size: 0.8125rem;
    cursor: pointer;
    white-space: nowrap;

    &:hover { background: rgba( 255, 255, 255, 0.3 ); }
`

const DismissButton = styled.button`
    display: inline-flex;
    align-items: center;
    padding: 0.15rem;
    background: none;
    color: rgba( 255, 255, 255, 0.7 );
    border: none;
    cursor: pointer;
    border-radius: ${ p => p.theme.border_radius.sm };

    &:hover { color: #fff; }
`

/**
 * Slim banner for app update notifications — sits between TopBar and MainArea.
 *
 * Three states:
 * - Available: shows version + download button
 * - Downloading: shows progress percentage
 * - Ready: shows install/restart button
 *
 * @param {Object} props
 * @param {Object|null} props.available_update - { version, release_notes }
 * @param {boolean} props.is_downloading
 * @param {number} props.download_progress - 0–100
 * @param {boolean} props.is_ready_to_install
 * @param {boolean} props.dismissed
 * @param {Function} props.on_download
 * @param {Function} props.on_install
 * @param {Function} props.on_dismiss
 */
export default function UpdateBanner( {
    available_update, is_downloading, download_progress,
    is_ready_to_install, dismissed, on_download, on_install, on_dismiss,
} ) {

    // Nothing to show
    if( !available_update || dismissed ) return null

    const { version } = available_update

    // Ready to install — prompt restart
    if( is_ready_to_install ) return <Banner>
        <Message>Version { version } is ready to install</Message>
        <ActionButton onClick={ on_install }>
            <RefreshCw size={ 14 } /> Restart now
        </ActionButton>
        <DismissButton onClick={ on_dismiss } aria-label="Dismiss">
            <X size={ 14 } />
        </DismissButton>
    </Banner>

    // Download in progress
    if( is_downloading ) return <Banner>
        <Message>Downloading v{ version }… { download_progress }%</Message>
    </Banner>

    // Update available — offer download
    return <Banner>
        <Message>Version { version } is available</Message>
        <ActionButton onClick={ on_download }>
            <Download size={ 14 } /> Download
        </ActionButton>
        <DismissButton onClick={ on_dismiss } aria-label="Dismiss">
            <X size={ 14 } />
        </DismissButton>
    </Banner>

}
