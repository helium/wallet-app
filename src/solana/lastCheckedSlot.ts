import { SecureStorageKeys, storeSecureItem } from '../storage/secureStorage'
import { AsyncAccountCache } from './AsyncAccountCache'

// Store the slot only after the cache write lands, so a failed write
// does not make the next refresh skip the accounts it lost.
export const saveCacheThenSlot = async (
  asyncCache: AsyncAccountCache,
  currentSlot: number,
): Promise<void> => {
  await asyncCache.setAsyncStorage()
  await storeSecureItem(
    SecureStorageKeys.LAST_CHECKED_SLOT,
    currentSlot.toString(),
  )
}
