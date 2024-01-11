import { AccountCache, ParsedAccountBase } from '@helium/account-fetch-cache'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AccountInfo, PublicKey } from '@solana/web3.js'

type SerializedAccountInfo = {
  /** `true` if this account's data contains a loaded program */
  executable: boolean
  /** Identifier of the program that owns the account */
  owner: string
  /** Number of lamports assigned to the account */
  lamports: number
  /** Optional data assigned to the account */
  data: string
  /** Optional rent epoch info for account */
  rentEpoch?: number
}

function deserialize(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
): ParsedAccountBase<unknown> | undefined {
  if (value) {
    return {
      pubkey: new PublicKey(key),
      account: {
        ...value,
        owner: new PublicKey(value.owner),
        data: Buffer.from(value.data, 'base64'),
      } as AccountInfo<Buffer>,
    }
  }
}

function serialize(account: AccountInfo<Buffer>): SerializedAccountInfo {
  return {
    ...account,
    owner: account.owner.toBase58(),
    data: account.data.toString('base64'),
  }
}

const TWO_MB = 2 * 1024 * 1024

export class AsyncAccountCache implements AccountCache {
  cacheKey: string

  cache = new Map<string, ParsedAccountBase<unknown> | null>()

  private cacheOrder: Map<string, number> = new Map() // Maintain the order of keys based on usage

  debouncedSet: () => void

  constructor(cacheKey: string) {
    this.cacheKey = cacheKey
    this.debouncedSet = debounce(this.setAsyncStorage, 10000)
  }

  keys(): string[] {
    return [...this.cache.keys()]
  }

  async init(): Promise<void> {
    const cachedData = await AsyncStorage.getItem(this.cacheKey)
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData)
      this.cache = new Map<string, ParsedAccountBase<unknown> | null>(
        parsedCache.map(([key, value]: unknown[]) => [
          key,
          deserialize(key as string, value),
        ]),
      )
    }
  }

  delete(key: string): void {
    this.cache.delete(key)
    this.debouncedSet()
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  get(key: string): ParsedAccountBase<unknown> | null | undefined {
    const value = this.cache.get(key)
    if (value) {
      // Update the cache order based on key usage
      this.cacheOrder.set(key, Date.now()) // Update the timestamp for the key
    }
    return value
  }

  set(key: string, value: ParsedAccountBase<unknown> | null): void {
    this.cache.set(key, value)
    this.debouncedSet()
  }

  private setAsyncStorage = (): void => {
    // Make sure we purge the least recently used items
    const orderedCache = [...this.cache.keys()]
      .sort(
        (a, b) => (this.cacheOrder.get(b) || 0) - (this.cacheOrder.get(a) || 0),
      ) // Sort by timestamp
      .map((key) => [key, this.cache.get(key)])
    let serializedCache = Array.from(orderedCache).map(([key, value]) => [
      key,
      value ? serialize((value as ParsedAccountBase<unknown>).account) : null,
    ])

    let serializedData = JSON.stringify(serializedCache)
    let dataSizeInBytes = Buffer.byteLength(serializedData)

    // Limit 2mb per async storage item
    // Track a maximum of 200 accounts to save from too many calls on load
    while (dataSizeInBytes > TWO_MB || serializedCache.length > 200) {
      // estimate num accounts to delete
      const bytesPerAccount = dataSizeInBytes / serializedCache.length
      const bytesOver = dataSizeInBytes - TWO_MB
      const numToDelete = Math.ceil(bytesOver / bytesPerAccount)
      serializedCache = serializedCache.slice(
        0,
        Math.min(200, serializedCache.length - numToDelete),
      )
      serializedData = JSON.stringify(serializedCache)
      dataSizeInBytes = Buffer.byteLength(serializedData)
    }

    AsyncStorage.setItem(this.cacheKey, serializedData)
  }
}

function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout
  return function (this: any, ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}
