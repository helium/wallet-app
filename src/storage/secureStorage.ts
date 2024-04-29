import Address from '@helium/address'
import { Keypair, Mnemonic } from '@helium/crypto-react-native'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { keypairFromSeed } from '@hooks/useDerivationAccounts'
import { Keypair as SolanaKeypair } from '@solana/web3.js'
import * as bip39 from 'bip39'
import * as SecureStore from 'expo-secure-store'
import { Alert } from 'react-native'
import Config from 'react-native-config'
import { navToImportAccount } from '../navigation/NavigationHelper'
import { ellipsizeAddress } from '../utils/accountUtils'
import i18n from '../utils/i18n'
import { CSAccount } from './cloudStorage'

export enum SecureStorageKeys {
  WALLET_API_TOKEN = 'walletApiToken',
  PIN = 'pin',
  PIN_FOR_PAYMENT = 'pinForPayment',
  AUTH_INTERVAL = 'authInterval',
  LOCKED = 'locked',
  CURRENCY = 'currency',
  EXPLORER = 'explorer',
  ENABLE_HAPTIC = 'enableHaptic',
  CONVERT_TO_CURRENCY = 'convertToCurrency',
  LAST_IDLE = 'lastIdle',
  ENABLE_TESTNET = 'enableTestnet',
  HIDE_PRIVATE_KEY_ALERT = 'hidePrivateKeyAlert',
  SHOW_NUMERIC_CHANGE = 'showNumericChange',
  DONE_SOLANA_MIGRATION = 'doneSolanaMigration',
  MANUAL_SOLANA_MIGRATION = 'manualSolanaMigration',
  SESSION_KEY = 'sessionKey',
  AUTO_GAS_MANAGEMENT_TOKEN = 'autoGasManagementToken',
}
type SecureStorageKeyTypes = `${SecureStorageKeys}`

export type SecureAccount = {
  mnemonic?: string[]
  keypair: { pk: string; sk: string }
  address: string
  derivationPath?: string
}

export function toSecureAccount({
  words,
  keypair,
  derivationPath = DEFAULT_DERIVATION_PATH,
}: {
  words?: string[]
  keypair: SolanaKeypair
  derivationPath?: string
}): SecureAccount {
  return {
    mnemonic: words,
    keypair: {
      pk: keypair.publicKey.toBuffer().toString('base64'),
      sk: Buffer.from(keypair.secretKey).toString('base64'),
    },
    address: heliumAddressFromSolAddress(keypair.publicKey.toString()),
    derivationPath,
  }
}

export const DEFAULT_DERIVATION_PATH = "m/44'/501'/0'/0'"
export const createDefaultKeypair = async ({
  givenMnemonic = null,
  use24Words,
}: {
  givenMnemonic?: Array<string> | null
  use24Words?: boolean
}): Promise<{ words: string[]; keypair: SolanaKeypair }> => {
  let mnemonic: Array<string>
  if (!givenMnemonic) {
    mnemonic = (await Mnemonic.create(use24Words ? 24 : 12)).words
  } else {
    mnemonic = givenMnemonic
  }
  const seed = bip39.mnemonicToSeedSync(mnemonic.join(' '), '')
  const keypair = await keypairFromSeed(seed, DEFAULT_DERIVATION_PATH)
  return { keypair: keypair!, words: mnemonic }
}

export const checkSecureAccount = async (
  address: string | undefined,
  forceShow?: boolean,
): Promise<boolean> => {
  const { t } = i18n
  if (!address) return false
  try {
    const secureAccount = await SecureStore.getItemAsync(address)
    if (!secureAccount) {
      const skipAlert = await getSecureItem(
        SecureStorageKeys.HIDE_PRIVATE_KEY_ALERT,
      )
      if (skipAlert === 'true' && !forceShow) return false
      Alert.alert(
        t('restoreAccount.missingAlert.title'),
        t('restoreAccount.missingAlert.message', {
          address: ellipsizeAddress(address),
        }),
        [
          {
            text: t('restoreAccount.missingAlert.button1'),
            onPress: () => {
              navToImportAccount({
                screen: 'AccountImportScreen',
                params: {
                  restoringAccount: true,
                  accountAddress: address,
                },
              })
            },
          },
          {
            text: t('generic.cancel'),
            style: 'cancel',
          },
        ],
      )
      return false
    }
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export const getSecureAccount = async (
  address: string | undefined,
): Promise<SecureAccount | undefined> => {
  if (!address) return
  try {
    const item = await SecureStore.getItemAsync(address)
    if (!item) return
    return JSON.parse(item) as SecureAccount
  } catch (e) {
    console.error(e)
  }
}

export const getSessionKey = async (): Promise<string | undefined> => {
  try {
    const item = await SecureStore.getItemAsync(SecureStorageKeys.SESSION_KEY)
    return item || Config.RPC_SESSION_KEY_FALLBACK
  } catch (e) {
    console.error(e)
  }
}

export const getKeypair = async (
  address: string,
): Promise<Keypair | undefined> => {
  const secureAccount = await getSecureAccount(address)
  if (!secureAccount) {
    return
  }

  const netType = Address.fromB58(address)?.netType
  return new Keypair(secureAccount.keypair, netType)
}

export const getSolanaKeypair = async (
  address: string,
): Promise<SolanaKeypair | undefined> => {
  const secureAccount = await getSecureAccount(address)
  if (!secureAccount) {
    return
  }

  return SolanaKeypair.fromSecretKey(
    Buffer.from(secureAccount.keypair.sk, 'base64'),
  )
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
  SecureStore.deleteItemAsync(SecureStorageKeys.HIDE_PRIVATE_KEY_ALERT),
]
