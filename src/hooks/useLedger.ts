import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState } from 'react'
import { last } from 'lodash'
import { useTranslation } from 'react-i18next'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { solAddressToHelium } from '@utils/accountUtils'
import base58 from 'bs58'
import { PublicKey } from '@solana/web3.js'
import { useSolana } from '../solana/SolanaProvider'
import { LedgerDevice } from '../storage/cloudStorage'
import { runDerivationScheme } from '../utils/heliumLedger'

export type LedgerAccount = {
  address: string
  balance?: number
  alias: string
  accountIndex: number
  solanaAddress: string
}

export const ManagerAppName = 'Solana'

const useLedger = () => {
  const [transport, setTransport] = useState<{
    transport: TransportBLE | TransportHID
    deviceId: string
  }>()
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [ledgerAccountsLoading, setLedgerAccountsLoading] = useState(false)
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()

  const openSolanaApp = useCallback(
    async (trans: TransportBLE | TransportHID) => {
      await trans.send(
        0xe0,
        0xd8,
        0x00,
        0x00,
        Buffer.from(ManagerAppName, 'utf8'),
      )
    },
    [],
  )

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

  //   useDisappear(() => {
  //     transport?.transport.close()
  //     setTransport(undefined)
  //   })

  const getLedgerAcct = useCallback(
    async (solana: AppSolana, accountIndex: number, display: boolean) => {
      const { address } = await solana.getAddress(
        runDerivationScheme(accountIndex),
        display,
      )
      let balance = 0
      try {
        const balanceResponse = await anchorProvider?.connection.getBalance(
          new PublicKey(base58.encode(address)),
        )

        if (balanceResponse) {
          balance = balanceResponse / 10 ** 9
        }
      } catch {
        // ignore
      }
      return {
        address: solAddressToHelium(bs58.encode(address)),
        balance,
        alias: t('ledger.show.alias', { accountIndex: accountIndex + 1 }),
        accountIndex,
        solanaAddress: bs58.encode(address),
      } as LedgerAccount
    },
    [anchorProvider?.connection, t],
  )

  const getLedgerAccounts = useCallback(
    async (solana: AppSolana, accounts: LedgerAccount[]): Promise<void> => {
      let index = -1
      const prevAcct = last(accounts)
      if (prevAcct) {
        index = prevAcct.accountIndex + 1
      }
      if (index >= 256) return

      const acct = await getLedgerAcct(solana, index, false)
      const next = [...accounts, acct]
      setLedgerAccounts(next)

      if (!acct.balance) return

      return getLedgerAccounts(solana, next)
    },
    [getLedgerAcct],
  )

  const updateLedgerAccounts = useCallback(
    async (device: LedgerDevice) => {
      if (ledgerAccountsLoading) return

      const nextTransport = await getTransport(device.id, device.type)
      if (!nextTransport) {
        throw new Error('Transport could not be created')
      }

      const solana = new AppSolana(nextTransport)

      setLedgerAccountsLoading(true)
      await getLedgerAccounts(solana, [])
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
    openSolanaApp,
  }
}

export default useLedger
