import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState } from 'react'
import { NetType } from '@helium/address/build/NetTypes'
import { last } from 'lodash'
import { useTranslation } from 'react-i18next'
import { ApolloError } from '@apollo/client'
import { LedgerDevice } from '../storage/cloudStorage'
import { useAccountLazyQuery } from '../generated/graphql'
import useDisappear from './useDisappear'
import { runDerivationScheme } from './heliumLedger'

export type LedgerAccount = {
  address: string
  balance?: number
  alias: string
  accountIndex: number
}

const useLedger = () => {
  const [transport, setTransport] = useState<{
    transport: TransportBLE | TransportHID
    deviceId: string
  }>()
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [ledgerAccountsLoading, setLedgerAccountsLoading] = useState(false)
  const [getAccount] = useAccountLazyQuery()
  const { t } = useTranslation()

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

  const getLedgerAcct = useCallback(
    async (
      helium: AppHelium,
      netType: NetType,
      accountIndex: number,
      display: boolean,
    ) => {
      const { address } = await helium.getAddress(
        runDerivationScheme(accountIndex, netType),
        display,
        accountIndex,
      )
      let balance: number | undefined
      try {
        const { data: accountData } = await getAccount({
          variables: { address },
        })
        balance = accountData?.account?.balance
      } catch (e) {
        const error = e as ApolloError
        throw new Error(`Api failure - ${error.message}`)
      }

      return {
        address,
        balance,
        alias: t('ledger.show.alias', { accountIndex: accountIndex + 1 }),
        accountIndex,
      } as LedgerAccount
    },
    [getAccount, t],
  )

  const getLedgerAccounts = useCallback(
    async (
      helium: AppHelium,
      netType: NetType,
      accounts: LedgerAccount[],
    ): Promise<void> => {
      let index = 0
      const prevAcct = last(accounts)
      if (prevAcct) {
        index = prevAcct.accountIndex + 1
      }
      if (index >= 256) return

      const acct = await getLedgerAcct(helium, netType, index, false)
      const next = [...accounts, acct]
      setLedgerAccounts(next)

      if (!acct.balance) return

      return getLedgerAccounts(helium, netType, next)
    },
    [getLedgerAcct],
  )

  const updateLedgerAccounts = useCallback(
    async (device: LedgerDevice, netType: NetType) => {
      if (ledgerAccountsLoading) return

      const nextTransport = await getTransport(device.id, device.type)
      if (!nextTransport) {
        throw new Error('Transport could not be created')
      }

      const helium = new AppHelium(nextTransport)

      setLedgerAccountsLoading(true)
      await getLedgerAccounts(helium, netType, [])
      setLedgerAccountsLoading(false)
    },
    [getLedgerAccounts, getTransport, ledgerAccountsLoading],
  )

  return {
    transport,
    getTransport,
    ledgerAccounts,
    updateLedgerAccounts,
    ledgerAccountsLoading,
  }
}

export default useLedger
