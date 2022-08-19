import { PaymentV2, TokenBurnV1 } from '@helium/transactions'
import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState, useEffect } from 'react'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import Config from 'react-native-config'
import { Observable, Subject } from 'rxjs'
import { useTranslation } from 'react-i18next'
import { NetType } from '@helium/address/build/NetTypes'
import { NetTypes } from '@helium/address'
import { CSAccounts } from '../storage/cloudStorage'
import { AccountDocument } from '../generated/graphql'
import useDisappear from './useDisappear'

export type LedgerAccount = {
  address: string
  balance: number
  alias: string
  isSelected: boolean
}

let ledgerAccounts: LedgerAccount[] = []

const updates = new Subject<LedgerAccount[]>()

/**
 * Set the accounts that are available on the ledger.
 * @param data ledger accounts
 * @returns
 */
export function setLedgerAccounts(data: LedgerAccount[]): void {
  if (data === ledgerAccounts) return
  ledgerAccounts = data
  updates.next([...data])
}

/**
 * Get the accounts that are available on the ledger.
 * @returns an array of accounts that are available on the ledger.
 */
export function getCurrentLedgerAccounts(): LedgerAccount[] {
  return ledgerAccounts
}

/**
 * Gets the observable that emits when the ledger accounts change.
 * @returns observable that emits an array of accounts that are available on the ledger.
 */
export function getLedgerAccountsUpdates(): Observable<LedgerAccount[]> {
  return updates.asObservable()
}

/**
 * Custom hook that returns the accounts that are available on the ledger.
 * @returns state of the ledger accounts
 */
export function useLedgerAccounts(): LedgerAccount[] {
  const [state, setState] = useState(getCurrentLedgerAccounts)
  const { t } = useTranslation()

  // Add correct alias for each account
  ledgerAccounts.forEach((acc, index) => {
    acc.alias = `${t('ledger.show.alias')} ${index + 1}`
  })

  useEffect(() => {
    const sub = getLedgerAccountsUpdates().subscribe(setState)
    return () => {
      setLedgerAccounts([])
      sub.unsubscribe()
    }
  }, [])
  return state
}

const mainNetDerivation = (account = 0) => `44'/904'/${account}'/0'/0'` // HD derivation path
const testNetDerivation = (account = 0) => `44'/905'/${account}'/0'/0'` // HD derivation path

export const apolloClient = new ApolloClient({
  uri: Config.GRAPH_URI,
  cache: new InMemoryCache(),
})

// Replaces the account alias with the index from the ledger
const runDerivationScheme = (account = 0, netType: NetType) => {
  if (netType === NetTypes.TESTNET) return testNetDerivation(account)
  return mainNetDerivation(account)
}

// Get account from nova wallet api
const getAccount = async (address: string) => {
  return apolloClient.query({
    query: AccountDocument,
    variables: {
      address,
    },
  })
}

/**
 * Sets the accounts available on the ledger using accounts observable.
 * @param transport transport to use for the ledger
 * @param accounts array of accounts to use for the ledger
 * @param netType network type to use for the ledger
 * @returns
 */
export const getLedgerAddress = async (
  transport: TransportBLE | TransportHID,
  accounts: CSAccounts | undefined,
  netType: NetType,
) => {
  const helium = new AppHelium(transport)
  const tempLedgerAccounts: LedgerAccount[] = []
  if (!accounts) {
    const { address } = await helium.getAddress(
      runDerivationScheme(0, netType),
      true,
      0,
    )
    const { data: accountData } = await getAccount(address)
    tempLedgerAccounts.push({
      address,
      balance: accountData.account.balance,
      alias: '',
      isSelected: true,
    })
    setLedgerAccounts(tempLedgerAccounts)
  }

  const ledgerAddresses = [...Array(256).keys()]
  // eslint-disable-next-line no-restricted-syntax
  for (const account of ledgerAddresses) {
    // eslint-disable-next-line no-await-in-loop
    const { address } = await helium.getAddress(
      runDerivationScheme(account, netType),
      false,
      account,
    )

    // eslint-disable-next-line no-await-in-loop
    const { data: accountData } = await getAccount(address)

    if (!accountData?.account) {
      throw new Error('Network error')
    }

    tempLedgerAccounts.push({
      address,
      balance: accountData.account.balance,
      alias: '',
      isSelected: true,
    })

    setLedgerAccounts([...tempLedgerAccounts])

    // TODO: Handle other token balances when ledger officially supports them.
    if (accountData?.account?.balance === 0) {
      return
    }
  }
}

export const signLedgerPayment = async (
  transport: TransportBLE | TransportHID,
  paymentV2: PaymentV2,
  accountIndex: number,
) => {
  const helium = new AppHelium(transport)
  const { txn } = await helium.signPaymentV2(paymentV2, accountIndex)
  return txn
}

export const signLedgerBurn = async (
  transport: TransportBLE | TransportHID,
  burnV1: TokenBurnV1,
  accountIndex: number,
) => {
  const helium = new AppHelium(transport)
  return helium.signTokenBurnV1(burnV1, accountIndex)
}

export const useLedger = () => {
  const [transport, setTransport] = useState<{
    transport: TransportBLE | TransportHID
    deviceId: string
  }>()

  const getTransport = useCallback(
    async (nextDeviceId: string, type: 'usb' | 'bluetooth') => {
      if (transport?.deviceId === nextDeviceId) {
        return transport.transport
      }

      let newTransport: TransportBLE | TransportHID | null = null
      if (type === 'usb') {
        await TransportHID.create()
        const devices = await TransportHID.list()
        const device = devices.find(
          (d) => d.deviceId === parseInt(nextDeviceId, 10),
        )
        if (!device) return
        newTransport = await TransportHID.open(device)
      } else {
        newTransport = await TransportBLE.open(nextDeviceId)
      }
      if (!newTransport) return

      newTransport.on('disconnect', () => {
        // Intentionally for the sake of simplicity we use a transport local state
        // and remove it on disconnect.
        // A better way is to pass in the device.id and handle the connection internally.
        setTransport(undefined)
      })
      setTransport({ transport: newTransport, deviceId: nextDeviceId })

      return newTransport
    },
    [transport],
  )

  useDisappear(() => {
    transport?.transport.close()
    setTransport(undefined)
  })

  return { transport, getTransport }
}
