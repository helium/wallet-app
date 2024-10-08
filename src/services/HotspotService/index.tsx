import React, { useMemo } from 'react'
import Hotspot from '@assets/images/hotspot.svg'
import ServiceSheetPage, {
  ServiceNavBarOption,
} from '@components/ServiceSheetPage'
import CollectablesNavigator from '@features/collectables/CollectablesNavigator'

const HotspotService = () => {
  const options = useMemo((): Array<ServiceNavBarOption> => {
    return [
      { name: 'Hotspot', Icon: Hotspot, component: CollectablesNavigator },
    ]
  }, [])

  return <ServiceSheetPage options={options} />
}

export default HotspotService
