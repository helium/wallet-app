import {
  SecureStorageKeys,
  getSecureItem,
  storeSecureItem,
} from '../storage/secureStorage'
import { AsyncAccountCache } from './AsyncAccountCache'

// The slot is only valid for the account cache (cluster) it was saved with.
type StoredSlot = { cacheKey: string; slot: number }

// Store the slot only after the cache write lands, so a failed write
// does not make the next refresh skip the accounts it lost.
export const saveCacheThenSlot = async (
  asyncCache: AsyncAccountCache,
  currentSlot: number,
): Promise<void> => {
  await asyncCache.setAsyncStorage()
  const stored: StoredSlot = {
    cacheKey: asyncCache.cacheKey,
    slot: currentSlot,
  }
  await storeSecureItem(
    SecureStorageKeys.LAST_CHECKED_SLOT,
    JSON.stringify(stored),
  )
}

// A slot saved for another cache, or in the old bare-number format,
// reads as no slot, so the caller does a full fetch.
export const getLastCheckedSlot = async (
  cacheKey: string,
): Promise<number | undefined> => {
  const raw = await getSecureItem(SecureStorageKeys.LAST_CHECKED_SLOT)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSlot> | null
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.cacheKey === cacheKey &&
      typeof parsed.slot === 'number'
    ) {
      return parsed.slot
    }
  } catch {
    // Not JSON: no usable slot.
  }
  return undefined
}
