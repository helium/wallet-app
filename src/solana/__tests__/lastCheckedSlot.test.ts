import AsyncStorage from '@react-native-async-storage/async-storage'
import { Keypair } from '@solana/web3.js'
import { AsyncAccountCache } from '../AsyncAccountCache'
import { saveCacheThenSlot } from '../lastCheckedSlot'
import { SecureStorageKeys, storeSecureItem } from '../../storage/secureStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))
jest.mock('../../storage/secureStorage', () => ({
  SecureStorageKeys: { LAST_CHECKED_SLOT: 'lastCheckedSlot' },
  storeSecureItem: jest.fn(() => Promise.resolve()),
}))

const setItem = AsyncStorage.setItem as jest.Mock
const storeSlot = storeSecureItem as jest.Mock

const deferred = () => {
  let resolve!: () => void
  let reject!: (e: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  // A mutant that drops the write promise must fail an assertion, not
  // crash Jest with an unhandled rejection.
  promise.catch(() => {})
  return { promise, resolve, reject }
}

const cacheWithOneAccount = () => {
  const cache = new AsyncAccountCache('accounts-test')
  const pubkey = Keypair.generate().publicKey
  cache.set(pubkey.toBase58(), {
    pubkey,
    account: {
      data: Buffer.from([1, 2, 3]),
      executable: false,
      lamports: 1,
      owner: Keypair.generate().publicKey,
      rentEpoch: 0,
    },
  })
  return cache
}

describe('saveCacheThenSlot', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setItem.mockReset()
    storeSlot.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('stores the slot only after the account cache write resolves', async () => {
    const write = deferred()
    setItem.mockReturnValue(write.promise)

    const saved = saveCacheThenSlot(cacheWithOneAccount(), 42)
    await Promise.resolve()
    await Promise.resolve()

    expect(setItem).toHaveBeenCalledTimes(1)
    expect(setItem.mock.calls[0][0]).toBe('accounts-test')
    expect(storeSlot).not.toHaveBeenCalled()

    write.resolve()
    await saved

    expect(storeSlot).toHaveBeenCalledWith(
      SecureStorageKeys.LAST_CHECKED_SLOT,
      '42',
    )
  })

  it('keeps the old slot when the account cache write fails', async () => {
    const write = deferred()
    setItem.mockReturnValue(write.promise)

    const saved = saveCacheThenSlot(cacheWithOneAccount(), 42)
    write.reject(new Error('disk full'))

    await expect(saved).rejects.toThrow('disk full')
    expect(storeSlot).not.toHaveBeenCalled()
  })

  it('rejects when the slot write fails', async () => {
    setItem.mockResolvedValue(undefined)
    const slotWrite = deferred()
    storeSlot.mockReturnValueOnce(slotWrite.promise)

    const saved = saveCacheThenSlot(cacheWithOneAccount(), 42)
    slotWrite.reject(new Error('keychain locked'))

    await expect(saved).rejects.toThrow('keychain locked')
  })
})
