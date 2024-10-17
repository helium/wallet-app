import React, { useMemo } from 'react'
import Hotspot from '@assets/images/hotspot.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import CollectablesNavigator from '@features/collectables/CollectablesNavigator'
import { StackNavigationProp } from '@react-navigation/stack'

export type HotspotServiceStackParamList = {
  Hotspot: undefined
}

export type HotspotServiceNavigationProp =
  StackNavigationProp<HotspotServiceStackParamList>

const HotspotService = () => {
  const options = useMemo((): Array<ServiceNavBarOption> => {
    return [
      { name: 'Hotspot', Icon: Hotspot, component: CollectablesNavigator },
    ]
  }, [])

  return <ServiceSheetPage options={options} />
}

export default HotspotService
