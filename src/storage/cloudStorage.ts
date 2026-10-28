/* eslint-disable no-debugger */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { NetTypes as NetType } from '@helium/address'
import { heliumAddressToSolAddress } from '@helium/spl-utils'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { createHash } from 'crypto'
import { cloneDeep, sortBy, values } from 'lodash'
import { useCloudStore } from '../store/cloudStore'
import { importLegacyState } from './importLegacyState'
import { getSecureAccount } from './secureStorage'

export type LedgerDevice = {
  id: string
  name: string
  type: 'usb' | 'bluetooth'
}

export type KeystoneDevice = {
  masterFingerprint: string
  device: string
}

export type CSAccount = {
  alias: string
  address: string
  solanaAddress?: string
  netType: NetType.NetType
  derivationPath?: string
  ledgerDevice?: LedgerDevice
  keystoneDevice?: KeystoneDevice
  accountIndex?: number
  // Hash of the mnemonic so we can group accts with the same mnemonic
  mnemonicHash?: string
  proposalCountByMint?: Record<string, number>
  proposalIdsSeenByMint?: Record<string, string[]>
  //
  version?: CSAccountVersion
}
export type CSAccountVersion = 'v1'
export type CSAccounts = Record<string, CSAccount>

export type CSToken = Record<string, string[]>

// The first-launch import fills the cloud store, so every read and write
// waits for it. Reads return copies, as the old JSON reads did, so callers
// can change them without changing the store.
const readCloudStore = async () => {
  await importLegacyState()
  return cloneDeep(useCloudStore.getState())
}

const writeCloudStore = async (
  state: Parameters<typeof useCloudStore.setState>[0],
) => {
  await importLegacyState()
  useCloudStore.setState(state)
}

export const restoreVisibleTokens = async () =>
  (await readCloudStore()).visibleTokens

export const updateVisibleTokens = (visibleTokens: CSToken) =>
  writeCloudStore({ visibleTokens })

export const sortAccounts = (
  accts: CSAccounts,
  defaultAddress: string | undefined | null,
) => {
  const acctList = values(accts)
  const sortedByAlias = sortBy(acctList, 'alias') || []
  const sortedByAliasWithSolanaAddress = sortedByAlias.map((acct) => {
    return acct
  })
  if (defaultAddress) {
    const defaultAccount = sortedByAliasWithSolanaAddress.find(
      (a) => a.address === defaultAddress,
    )
    if (defaultAccount) {
      // put default at beginning
      const filtered = sortedByAliasWithSolanaAddress.filter(
        (a) => a.address !== defaultAddress,
      )
      filtered.unshift(defaultAccount)
      return filtered
    }
  }
  return sortedByAliasWithSolanaAddress
}
const getAccounts = async (): Promise<CSAccounts> =>
  (await readCloudStore()).accounts || {}

export const restoreAccounts = async () => {
  const { contacts } = await readCloudStore()
  const csAccounts = await getAccounts()
  const defaultAccountAddress = await getCloudDefaultAccountAddress()

  let currentAccount: CSAccount | null = null
  if (Object.keys(csAccounts).length) {
    const [first] = sortAccounts(csAccounts, defaultAccountAddress)
    currentAccount = first
  }

  // One time migration
  let updatedVersions = false
  const changed = await Promise.all(
    Object.entries(csAccounts).map(async ([address, acct]) => {
      if (!acct.version) {
        updatedVersions = true
        // eslint-disable-next-line no-param-reassign
        acct.version = 'v1'
        const { mnemonic } = (await getSecureAccount(acct.address)) || {}
        if (mnemonic) {
          const mnemonicHash = createHash('sha256')
            .update(mnemonic.join(' '))
            .digest('hex')
          // eslint-disable-next-line no-param-reassign
          acct.mnemonicHash = mnemonicHash
          if (!acct.derivationPath) {
            // eslint-disable-next-line no-param-reassign
            acct.derivationPath = HELIUM_DERIVATION
          }
        }
      }

      if (!acct.solanaAddress) {
        // eslint-disable-next-line no-param-reassign
        acct.solanaAddress = heliumAddressToSolAddress(acct.address)
      }

      return { address, acct }
    }),
  )

  if (updatedVersions) {
    await updateCloudAccounts(
      changed.reduce((acc, { address, acct }) => {
        // eslint-disable-next-line no-param-reassign
        acc[address] = acct
        return acc
      }, {} as CSAccounts),
    )
  }

  return { csAccounts, current: currentAccount, contacts: contacts || [] }
}

export const updateCloudAccounts = (accounts: CSAccounts) =>
  writeCloudStore({ accounts })

export const updateCloudContacts = (contacts: CSAccount[]) =>
  writeCloudStore({ contacts })

export const updateLastViewedNotifications = async (time: number) =>
  writeCloudStore({ lastViewedNotifications: time })

export const getLastViewedNotifications = async () =>
  (await readCloudStore()).lastViewedNotifications

export const setCloudDefaultAccountAddress = async (
  address: string | undefined,
) => writeCloudStore({ defaultAccountAddress: address })

export const getCloudDefaultAccountAddress = async () =>
  (await readCloudStore()).defaultAccountAddress
