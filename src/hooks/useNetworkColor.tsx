import { useMemo } from 'react'
import { NetTypes } from '@helium/address'
import { Color } from '@theme/theme'

export default ({
  defaultColor,
  netType,
  muted,
}: {
  netType?: NetTypes.NetType
  defaultColor?: Color
  muted?: boolean
}) => {
  return useMemo(() => {
    if (netType === NetTypes.TESTNET) {
      if (muted) {
        return 'orange.dark-500'
      }
      return 'testnet'
    }
    if (defaultColor) {
      return defaultColor
    }
  }, [defaultColor, muted, netType])
}
