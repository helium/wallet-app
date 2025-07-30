import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState } from 'react'
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
  derivationPath: string
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

  const createLedgerAccount = useCallback(
    async (
      solana: AppSolana,
      accountIndex: number,
      useDefault: boolean,
      derivationPath: string,
    ): Promise<LedgerAccount | null> => {
      try {
        const { address } = await solana.getAddress(
          runDerivationScheme(accountIndex, useDefault),
          false,
        )
        let balance = 0
        try {
          const balanceResponse = await anchorProvider?.connection.getBalance(
            new PublicKey(base58.encode(new Uint8Array(address))),
          )
          if (balanceResponse) {
            balance = balanceResponse / 10 ** 9
          }
        } catch {
          // ignore
        }
        return {
          address: solAddressToHelium(bs58.encode(new Uint8Array(address))),
          balance,
          derivationPath,
          alias: `${t('ledger.show.alias', {
            accountIndex: accountIndex + 1,
          })}`,
          accountIndex,
          solanaAddress: bs58.encode(new Uint8Array(address)),
        }
      } catch {
        // ignore if derivation fails
        return null
      }
    },
    [anchorProvider?.connection, t],
  )

  const getLedgerAccountsForBothPaths = useCallback(
    async (
      solana: AppSolana,
      accountIndex: number,
    ): Promise<LedgerAccount[]> => {
      const accounts: LedgerAccount[] = []

      // Check legacy path: 44'/501'/x'
      const legacyAccount = await createLedgerAccount(
        solana,
        accountIndex,
        false,
        'Legacy',
      )
      if (legacyAccount) accounts.push(legacyAccount)

      // Check default path: 44'/501'/x'/0'
      const defaultAccount = await createLedgerAccount(
        solana,
        accountIndex,
        true,
        'Default',
      )
      if (defaultAccount) accounts.push(defaultAccount)

      return accounts
    },
    [createLedgerAccount],
  )

  const getAllLedgerAccounts = useCallback(
    async (solana: AppSolana): Promise<LedgerAccount[]> => {
      const allAccounts: LedgerAccount[] = []

      // Check accounts from index 0 to 9
      for (let accountIndex = 0; accountIndex < 10; accountIndex += 1) {
        const accounts = await getLedgerAccountsForBothPaths(
          solana,
          accountIndex,
        )
        allAccounts.push(...accounts)

        // If no balance found in this batch and we're past index 3, stop checking
        const hasBalance = accounts.some(
          (acc) => acc.balance && acc.balance > 0,
        )
        if (!hasBalance && accountIndex >= 3) {
          break
        }
      }

      return allAccounts
    },
    [getLedgerAccountsForBothPaths],
  )

  const getLedgerAccounts = useCallback(
    async (solana: AppSolana, mainAccounts: LedgerAccount[]): Promise<void> => {
      const allIndexedAccounts = await getAllLedgerAccounts(solana)
      const allAccounts = [...mainAccounts, ...allIndexedAccounts]
      const accountsWithBalance = allAccounts.filter(
        (acc) => acc.balance && acc.balance > 0,
      )

      // Always include account 0 from default path (44'/501'/0'/0')
      const defaultAccount0 = allIndexedAccounts.find(
        (acc) =>
          acc.accountIndex === 0 && acc.derivationPath.includes('Default'),
      )

      // Always include account 0 from legacy path (44'/501'/0')
      const legacyAccount0 = allIndexedAccounts.find(
        (acc) =>
          acc.accountIndex === 0 && acc.derivationPath.includes('Legacy'),
      )

      const finalAccounts = [...accountsWithBalance]

      if (
        defaultAccount0 &&
        !accountsWithBalance.some(
          (acc) =>
            acc.accountIndex === 0 && acc.derivationPath.includes('Default'),
        )
      ) {
        finalAccounts.push(defaultAccount0)
      }

      if (
        legacyAccount0 &&
        !accountsWithBalance.some(
          (acc) =>
            acc.accountIndex === 0 && acc.derivationPath.includes('Legacy'),
        )
      ) {
        finalAccounts.push(legacyAccount0)
      }

      setLedgerAccounts(finalAccounts)
    },
    [getAllLedgerAccounts],
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
      // Check root derivation path first (44'/501')
      const mainAccounts: LedgerAccount[] = []
      try {
        const { address } = await solana.getAddress(
          runDerivationScheme(-1),
          false,
        )
        let balance = 0
        try {
          const balanceResponse = await anchorProvider?.connection.getBalance(
            new PublicKey(base58.encode(new Uint8Array(address))),
          )
          if (balanceResponse) {
            balance = balanceResponse / 10 ** 9
          }
        } catch {
          // ignore
        }
        mainAccounts.push({
          address: solAddressToHelium(bs58.encode(new Uint8Array(address))),
          balance,
          derivationPath: 'Root',
          alias: t('ledger.show.alias', { accountIndex: 'Root' }),
          accountIndex: -1,
          solanaAddress: bs58.encode(new Uint8Array(address)),
        })
      } catch {
        // ignore if derivation fails
      }

      // Start checking both derivation paths for each account index
      await getLedgerAccounts(solana, mainAccounts)
      setLedgerAccountsLoading(false)
    },
    [
      getLedgerAccounts,
      getTransport,
      ledgerAccountsLoading,
      anchorProvider?.connection,
      t,
    ],
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
