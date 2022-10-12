import { useMemo } from 'react'
import { NetTypes } from '@helium/address'
import { useAppStorage } from '../storage/AppStorageProvider'
import { Color } from '../theme/theme'

export default ({
  defaultColor,
  netType,
  muted,
}: {
  netType?: NetTypes.NetType
  defaultColor?: Color
  muted?: boolean
}) => {
  const { l1Network } = useAppStorage()
  return useMemo(() => {
    if (netType === NetTypes.TESTNET) {
      if (muted) {
        return 'lividBrown'
      }
      return 'testnet'
    }
    if (l1Network === 'solana_dev') return 'solanaPurple'
    if (defaultColor) {
      return defaultColor
    }
  }, [defaultColor, l1Network, muted, netType])
}
