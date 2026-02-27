import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { format_stats } from '../../utils/format'

const StatsText = styled.div`
    font-size: 0.75rem;
    color: ${ ( { theme } ) => theme.colors.text_muted };
    padding: ${ ( { theme } ) => `${ theme.spacing.xs } 0` };
    font-family: ${ ( { theme } ) => theme.fonts.mono };
`

/**
 * Displays generation stats below assistant messages
 * @param {Object} props
 * @param {import('../../providers/types').GenerationStats} props.stats
 * @returns {JSX.Element|null}
 */
export default function GenerationStats( { stats } ) {

    const { t } = useTranslation()

    if( !stats ) return null

    return <StatsText data-testid="generation-stats">
        { format_stats( stats, t ) }
    </StatsText>

}
