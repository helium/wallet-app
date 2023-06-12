import { useEffect, useState } from 'react'
import { HotspotWithPendingRewards } from '../types/solana'

export const useEntityKey = (hotspot: HotspotWithPendingRewards) => {
  const [entityKey, setEntityKey] = useState<string>()

  useEffect(() => {
    if (hotspot) {
      setEntityKey(hotspot.content.json_uri.split('/').slice(-1)[0])
    }
  }, [hotspot, setEntityKey])

  return entityKey
}
