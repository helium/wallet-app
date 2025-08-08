import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { solAddressToHelium } from '@utils/accountUtils'
import base58 from 'bs58'
import { PublicKey } from '@solana/web3.js'
import { AccountLayout, getAssociatedTokenAddress } from '@solana/spl-token'
import { HNT_MINT } from '@helium/spl-utils'
import { useSolana } from '../solana/SolanaProvider'
import { LedgerDevice } from '../storage/cloudStorage'
import {
  getDerivationPath,
  getDerivationPathLabel,
  type DerivationType,
} from '../utils/heliumLedger'

export type LedgerAccount = {
  address: string
  balance?: number
  derivationPath: string
  alias: string
  accountIndex: number
  solanaAddress: string
  hasBalance: boolean
  derivationType: DerivationType
  pathLabel: string
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
      derivationType: DerivationType,
    ): Promise<LedgerAccount | null> => {
      try {
        const derivationPath = getDerivationPath(accountIndex, derivationType)

        const { address } = await solana.getAddress(derivationPath, false)
        const publicKey = new PublicKey(base58.encode(new Uint8Array(address)))

        let balance = 0
        let hasBalance = false

        try {
          // Check SOL balance
          const balanceResponse = await anchorProvider?.connection.getBalance(
            publicKey,
          )
          if (balanceResponse) {
            balance = balanceResponse / 10 ** 9
            hasBalance = balance > 0
          }

          // Only check HNT token balance if there's no SOL balance
          if (!hasBalance) {
            const hntTokenAddress = await getAssociatedTokenAddress(
              HNT_MINT,
              publicKey,
            )
            const hntAccount = await anchorProvider?.connection.getAccountInfo(
              hntTokenAddress,
            )

            if (hntAccount && hntAccount.data) {
              try {
                const accInfo = AccountLayout.decode(
                  new Uint8Array(hntAccount.data),
                )
                const tokenAmount = BigInt(accInfo.amount)
                if (tokenAmount > 0n) {
                  hasBalance = true
                }
              } catch {
                // ignore token decode errors
              }
            }
          }
        } catch (error) {}

        const pathLabel =
          accountIndex === -1 ? 'Root' : getDerivationPathLabel(derivationType)
        const aliasKey = accountIndex === -1 ? 'Root' : accountIndex + 1

        return {
          address: solAddressToHelium(bs58.encode(new Uint8Array(address))),
          balance,
          pathLabel,
          derivationPath: `m/${derivationPath}`, // Store the full parseable path
          alias: `${t('ledger.show.alias', {
            accountIndex: aliasKey,
          })}`,
          accountIndex,
          solanaAddress: bs58.encode(new Uint8Array(address)),
          hasBalance,
          derivationType,
        }
      } catch (error) {
        return null
      }
    },
    [anchorProvider?.connection, t],
  )

  const getAllLedgerAccountsForDerivationType = useCallback(
    async (
      solana: AppSolana,
      derivationType: DerivationType,
    ): Promise<LedgerAccount[]> => {
      const accounts: LedgerAccount[] = []
      let batchStart = 0
      const batchSize = 10

      while (batchStart < 256) {
        // Check current batch of 10 accounts
        const batchAccounts: LedgerAccount[] = []

        const currentBatchStart = batchStart
        await Array.from({ length: batchSize }, (_, i) => i).reduce(
          async (promise, i) => {
            await promise
            const accountIndex = currentBatchStart + i
            if (accountIndex >= 256) return
            const account = await createLedgerAccount(
              solana,
              accountIndex,
              derivationType,
            )
            if (account) {
              batchAccounts.push(account)
            }
          },
          Promise.resolve(),
        )

        const batchAccountsWithBalance = batchAccounts.filter(
          (acc) => acc.hasBalance,
        )

        // If this is the first batch (0-9) and no accounts have balance
        if (batchStart === 0 && batchAccountsWithBalance.length === 0) {
          // Only add account 0 for core derivation types (root, default, legacy)
          const coreTypes: DerivationType[] = ['root', 'default', 'legacy']
          if (coreTypes.includes(derivationType)) {
            const account0 = batchAccounts.find((acc) => acc.accountIndex === 0)
            if (account0) {
              accounts.push(account0)
            }
          }
          break // Stop scanning this derivation type
        }

        // If any accounts in this batch have balance, add all accounts with balance
        if (batchAccountsWithBalance.length > 0) {
          accounts.push(...batchAccountsWithBalance)
          batchStart += batchSize // Continue to next batch
        } else {
          // No balance in this batch, stop scanning this derivation type
          break
        }
      }

      return accounts
    },
    [createLedgerAccount],
  )

  const getAllLedgerAccounts = useCallback(
    async (solana: AppSolana): Promise<LedgerAccount[]> => {
      const allAccounts: LedgerAccount[] = []

      // Check all derivation types sequentially to avoid Ledger device busy errors
      const allTypes: DerivationType[] = [
        'legacy',
        'default',
        'extended',
        'alternative',
        'migration',
        'change',
      ]

      await allTypes.reduce(async (promise, derivationType) => {
        await promise
        const accounts = await getAllLedgerAccountsForDerivationType(
          solana,
          derivationType,
        )
        allAccounts.push(...accounts)
      }, Promise.resolve())

      return allAccounts
    },
    [getAllLedgerAccountsForDerivationType],
  )

  const getLedgerAccounts = useCallback(
    async (solana: AppSolana, mainAccounts: LedgerAccount[]): Promise<void> => {
      const allIndexedAccounts = await getAllLedgerAccounts(solana)
      const allAccounts = [...mainAccounts, ...allIndexedAccounts]

      // Sort accounts for better UX: accounts with balance first, then by account index, then by derivation type
      allAccounts.sort((a, b) => {
        if (a.hasBalance !== b.hasBalance) {
          return b.hasBalance ? 1 : -1
        }

        if (a.accountIndex !== b.accountIndex) {
          return a.accountIndex - b.accountIndex
        }

        // Then by derivation type priority (most common first)
        const typeOrder: DerivationType[] = [
          'root',
          'default',
          'legacy',
          'extended',
          'alternative',
          'migration',
          'change',
        ]
        const aIndex = typeOrder.indexOf(a.derivationType)
        const bIndex = typeOrder.indexOf(b.derivationType)
        return aIndex - bIndex
      })

      setLedgerAccounts(allAccounts)
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
      const mainAccounts: LedgerAccount[] = []

      // Check Solana root path (44'/501')
      try {
        const solanaRootAccount = await createLedgerAccount(solana, -1, 'root')
        if (solanaRootAccount) {
          mainAccounts.push(solanaRootAccount)
        }
      } catch {
        // ignore if derivation fails
      }

      // Start checking all derivation paths for each account index
      await getLedgerAccounts(solana, mainAccounts)
      setLedgerAccountsLoading(false)
    },
    [
      createLedgerAccount,
      getLedgerAccounts,
      getTransport,
      ledgerAccountsLoading,
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
