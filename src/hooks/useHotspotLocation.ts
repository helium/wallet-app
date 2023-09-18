import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  iotInfoKey,
  mobileInfoKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { useAsync } from 'react-async-hook'
import { useAppDispatch } from '../store/store'
import { getGeocodedAddress } from '../store/slices/locationSlice'
import { RootState } from '../store/rootReducer'
import { useSolana } from '../solana/SolanaProvider'
import { IOT_SUB_DAO_KEY, MOBILE_SUB_DAO_KEY } from '../utils/constants'

const useHotspotLocation = (entityKey?: string) => {
  const dispatch = useAppDispatch()
  const { locations } = useSelector((state: RootState) => state.location)
  const { hemProgram } = useSolana()

  const { result: location } = useAsync(async () => {
    const [iotConfigKey] = rewardableEntityConfigKey(IOT_SUB_DAO_KEY, 'IOT')
    const [iotKey] = iotInfoKey(iotConfigKey, entityKey || '')
    const iotInfo = await hemProgram?.account.iotHotspotInfoV0.fetch(iotKey)
    if (iotInfo?.location) {
      const loc = iotInfo.location
      if (loc && loc.toString('hex') !== '0') {
        return loc
      }
    }

    const [mobileConfigKey] = rewardableEntityConfigKey(
      MOBILE_SUB_DAO_KEY,
      'MOBILE',
    )
    const [mobileKey] = mobileInfoKey(mobileConfigKey, entityKey || '')
    const mobileInfo = await hemProgram?.account.mobileHotspotInfoV0.fetch(
      mobileKey,
    )

    if (mobileInfo?.location) {
      const loc = mobileInfo.location
      if (loc && loc.toString('hex') !== '0') {
        return loc
      }
    }
  }, [])

  useEffect(() => {
    if (!entityKey || !location) return
    const geo = locations[location?.toString('hex') || '']
    if (geo) return

    dispatch(getGeocodedAddress({ location }))
  }, [dispatch, entityKey, location, locations])

  const streetAddress = useMemo(() => {
    const geo = locations[location?.toString('hex') || '']
    if (!geo || !geo.features?.length) return ''

    const feature = geo.features[0]

    const place = feature.context?.find((c) => c.id.includes('place'))
    const region = feature.context?.find((c) => c.id.includes('region'))

    if (place && region) {
      return `${place.text}, ${region.text}`
    }

    if (place) {
      return place
    }

    return region
  }, [location, locations])

  return streetAddress
}

export default useHotspotLocation
