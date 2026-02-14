import styled from 'styled-components'
import { Cpu, HardDrive, Monitor } from 'lucide-react'

const Container = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${ ( { theme } ) => theme.spacing.md };
    justify-content: center;
    padding: ${ ( { theme } ) => theme.spacing.md };
`

const InfoCard = styled.div`
    display: flex;
    align-items: center;
    gap: ${ ( { theme } ) => theme.spacing.sm };
    padding: ${ ( { theme } ) => `${ theme.spacing.sm } ${ theme.spacing.md }` };
    background: ${ ( { theme } ) => theme.colors.surface };
    border-radius: ${ ( { theme } ) => theme.border_radius.md };
    border: 1px solid ${ ( { theme } ) => theme.colors.border };
`

const Label = styled.span`
    font-size: 0.85rem;
    color: ${ ( { theme } ) => theme.colors.text_secondary };
`

const Value = styled.span`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${ ( { theme } ) => theme.colors.text };
`

/**
 * Displays detected device capabilities in a card layout
 * @param {Object} props
 * @param {import('../../utils/device_detection').DeviceCapabilities} props.capabilities
 * @returns {JSX.Element}
 */
export default function DeviceInfo( { capabilities } ) {

    if( !capabilities ) return null

    const { gpu, memory, cpu } = capabilities

    return <Container data-testid="device-info">

        { /* GPU info */ }
        <InfoCard>
            <Monitor size={ 16 } />
            <div>
                <Label>GPU: </Label>
                <Value>{ gpu.renderer }</Value>
            </div>
        </InfoCard>

        { /* VRAM */ }
        { gpu.estimated_vram > 0 && <InfoCard>
            <HardDrive size={ 16 } />
            <div>
                <Label>VRAM: </Label>
                <Value>~{ gpu.estimated_vram } GB</Value>
            </div>
        </InfoCard> }

        { /* RAM */ }
        { memory.device_memory && <InfoCard>
            <HardDrive size={ 16 } />
            <div>
                <Label>RAM: </Label>
                <Value>{ memory.device_memory } GB</Value>
            </div>
        </InfoCard> }

        { /* CPU cores */ }
        <InfoCard>
            <Cpu size={ 16 } />
            <div>
                <Label>Cores: </Label>
                <Value>{ cpu.cores }</Value>
            </div>
        </InfoCard>

    </Container>

}
