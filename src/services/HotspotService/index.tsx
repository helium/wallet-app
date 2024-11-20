import React, { useMemo } from 'react'
import Hotspot from '@assets/images/hotspot.svg'
import Map from '@assets/images/map.svg'
import Add from '@assets/images/add.svg'
import Coin from '@assets/images/coin.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import { StackNavigationProp } from '@react-navigation/stack'
import { PortalHost } from '@gorhom/portal'
import Box from '@components/Box'
import { HotspotWithPendingRewards } from '../../types/solana'
import HotspotPage from './HotspotPage'
import ExplorerPage from './ExplorerPage'
import AddHotspotPage from './AddHotspotPage'
import ClaimTokensPage from './ClaimTokensPage'

export type HotspotServiceStackParamList = {
  Hotspot: {
    newHotspot?: HotspotWithPendingRewards
  }
  Explorer: undefined
  AddHotspot: undefined
  ClaimTokens: undefined
}

export type HotspotServiceNavigationProp =
  StackNavigationProp<HotspotServiceStackParamList>

const HotspotService = () => {
  const options = useMemo((): Array<ServiceNavBarOption> => {
    return [
      { name: 'Hotspot', Icon: Hotspot, component: HotspotPage },
      { name: 'Explorer', Icon: Map, component: ExplorerPage },
      { name: 'AddHotspot', Icon: Add, component: AddHotspotPage },
      { name: 'ClaimTokens', Icon: Coin, component: ClaimTokensPage },
    ]
  }, [])

  return (
    <Box flex={1}>
      <Box flex={1}>
        <ServiceSheetPage options={options} />
      </Box>
      <PortalHost name="hotspot-portal" />
    </Box>
  )
}

export default HotspotService
