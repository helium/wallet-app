import { truthy } from '@helium/spl-utils'
import { useMemo } from 'react'
import { HotspotWithPendingRewards } from '../types/solana'

export function useHotspotAddress(
  hotspot: HotspotWithPendingRewards | undefined,
): string | undefined {
  const { metadata } = hotspot?.content || {}
  const attributes = useMemo(() => {
    return metadata?.attributes?.reduce((acc: any, att: any) => {
      if (att && att.trait_type && typeof att.value !== 'undefined') {
        acc[att.trait_type] = att.value
      }
      return acc
    }, {} as Record<string, string>)
  }, [metadata])
  return useMemo(() => {
    if (attributes) {
      const street = attributes.iot_street || attributes.mobile_street || ''
      const city = attributes.iot_city || attributes.mobile_city || ''
      const state = attributes.iot_state || attributes.mobile_state || ''

      return [street, city, state].filter(truthy).join(', ')
    }
  }, [attributes])
}
