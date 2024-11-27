import React, { useMemo } from 'react'
import Hotspot from '@assets/svgs/hotspot.svg'
import Map from '@assets/svgs/map.svg'
import Add from '@assets/svgs/add.svg'
import Coin from '@assets/svgs/coin.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import { StackNavigationProp } from '@react-navigation/stack'
import { PortalHost } from '@gorhom/portal'
import Box from '@components/Box'
import { HotspotWithPendingRewards } from '../../../types/solana'
import HotspotPage from './pages/HotspotPage'
import ExplorerPage from './pages/ExplorerPage'
import AddHotspotPage from './pages/AddHotspotPage'
import ClaimTokensPage from './pages/ClaimTokensPage'

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
