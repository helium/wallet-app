import BN from 'bn.js'
import { useMemo } from 'react'

export function useBN(num: bigint | undefined): BN | undefined {
  return useMemo(() => {
    if (typeof num === 'undefined') return undefined
    return new BN(num.toString())
  }, [num])
}
