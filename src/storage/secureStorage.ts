import { Address, Keypair, Mnemonic } from '@helium/crypto-react-native'
import * as SecureStore from 'expo-secure-store'
import { CSAccount } from './cloudStorage'

export enum SecureStorageKeys {
  PIN = 'pin',
  PIN_FOR_PAYMENT = 'pinForPayment',
  AUTH_INTERVAL = 'authInterval',
  LOCKED = 'locked',
  CURRENCY = 'currency',
  CONVERT_TO_CURRENCY = 'convertToCurrency',
  LAST_IDLE = 'lastIdle',
  SELECTED_LIST = 'selected_list',
}
type SecureStorageKeyTypes = `${SecureStorageKeys}`

export type SecureAccount = {
  mnemonic: string[]
  keypair: { pk: string; sk: string }
  address: string
}

export const createSecureAccount = async (
  givenMnemonic: Mnemonic | Array<string> | null = null,
  netType?: number,
  use24Words?: boolean,
): Promise<SecureAccount> => {
  let mnemonic: Mnemonic
  if (!givenMnemonic) {
    mnemonic = await Mnemonic.create(use24Words ? 24 : 12)
  } else if ('words' in givenMnemonic) {
    mnemonic = givenMnemonic
  } else {
    mnemonic = new Mnemonic(givenMnemonic)
  }
  const { keypair, address } = await Keypair.fromMnemonic(mnemonic, netType)

  const secureAccount = {
    mnemonic: mnemonic.words,
    keypair,
  }

  return { address: address.b58, ...secureAccount }
}

export const getSecureAccount = async (
  address: string,
): Promise<SecureAccount | undefined> => {
  try {
    const item = await SecureStore.getItemAsync(address)
    if (!item) return
    return JSON.parse(item) as SecureAccount
  } catch (e) {
    console.error(e)
  }
}

export const getKeypair = async (
  address: string,
): Promise<Keypair | undefined> => {
  const secureAccount = await getSecureAccount(address)
  if (!secureAccount) {
    throw new Error(`Secure account for ${address} could not be found`)
  }

  const netType = Address.fromB58(address)?.netType
  return new Keypair(secureAccount.keypair, netType)
}

export const storeSecureAccount = (secureAccount: SecureAccount) =>
  SecureStore.setItemAsync(secureAccount.address, JSON.stringify(secureAccount))

export const storeSecureItem = (key: SecureStorageKeyTypes, value: string) =>
  SecureStore.setItemAsync(key, value)

export const getSecureItem = (key: SecureStorageKeyTypes) =>
  SecureStore.getItemAsync(key)

export const deleteSecureItem = (key: SecureStorageKeyTypes) =>
  SecureStore.deleteItemAsync(key)

export const deleteSecureAccount = (account: CSAccount) =>
  SecureStore.deleteItemAsync(account.address)

export const signoutSecureStore = (addresses: string[]) => [
  ...addresses.map((key) => SecureStore.deleteItemAsync(key)),
  SecureStore.deleteItemAsync(SecureStorageKeys.PIN),
  SecureStore.deleteItemAsync(SecureStorageKeys.LAST_IDLE),
]
