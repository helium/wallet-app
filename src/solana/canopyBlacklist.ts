import axios from 'axios'

const WELL_KNOWN_CANOPY_URL = 'https://entities.nft.helium.io/v2/merkles'
let wellKnownCanopyCache: Record<string, number> | undefined

export async function fetchCanopyBlacklist(): Promise<Set<string>> {
  if (!wellKnownCanopyCache) {
    try {
      wellKnownCanopyCache = await (await axios.get(WELL_KNOWN_CANOPY_URL)).data
    } catch (e) {
      // Simulate without the blacklist rather than not at all
      console.warn('Could not fetch the canopy blacklist', e)
      return new Set<string>()
    }
  }

  if (wellKnownCanopyCache) {
    return new Set(Object.keys(wellKnownCanopyCache))
  }

  return new Set([])
}
