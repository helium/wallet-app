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
      balance?: number,
      hasBalance?: boolean,
      publicKey?: PublicKey, // Optional pre-obtained public key
    ): Promise<LedgerAccount | null> => {
      try {
        const derivationPath = getDerivationPath(accountIndex, derivationType)

        let address: Uint8Array
        if (publicKey) {
          // Use the pre-obtained public key
          address = publicKey.toBytes()
        } else {
          // Get address from Ledger (fallback for other calls)
          const result = await solana.getAddress(derivationPath, false)
          address = result.address
        }

        const pathLabel =
          accountIndex === -1 ? 'Root' : getDerivationPathLabel(derivationType)
        const aliasKey = accountIndex === -1 ? 'Root' : accountIndex + 1

        return {
          address: solAddressToHelium(bs58.encode(new Uint8Array(address))),
          balance: balance || 0,
          pathLabel,
          derivationPath: `m/${derivationPath}`, // Store the full parseable path
          alias: `${t('ledger.show.alias', {
            accountIndex: aliasKey,
          })}`,
          accountIndex,
          solanaAddress: bs58.encode(new Uint8Array(address)),
          hasBalance: hasBalance || false,
          derivationType,
        }
      } catch (error) {
        // Log errors for debugging if needed
        // console.log(`❌ createLedgerAccount error for ${derivationType} index ${accountIndex}:`, error)
        return null
      }
    },
    [t],
  )

  const checkBatchBalances = useCallback(
    async (
      publicKeys: PublicKey[],
    ): Promise<{ solBalances: number[]; hntBalances: boolean[] }> => {
      const solBalances: number[] = []
      const hntBalances: boolean[] = []

      try {
        // Batch check SOL balances
        const accountInfos =
          await anchorProvider?.connection.getMultipleAccountsInfo(publicKeys)

        if (accountInfos) {
          solBalances.push(
            ...accountInfos.map((accountInfo) =>
              accountInfo ? accountInfo.lamports / 10 ** 9 : 0,
            ),
          )
        }

        // Batch check HNT token balances for accounts with no SOL
        const hntTokenAddresses = await Promise.all(
          publicKeys.map((pk) => getAssociatedTokenAddress(HNT_MINT, pk)),
        )

        const hntAccountInfos =
          await anchorProvider?.connection.getMultipleAccountsInfo(
            hntTokenAddresses,
          )

        if (hntAccountInfos) {
          hntBalances.push(
            ...hntAccountInfos.map((hntAccount, i) => {
              // Only check HNT if no SOL balance
              if (solBalances[i] === 0 && hntAccount && hntAccount.data) {
                try {
                  const accInfo = AccountLayout.decode(
                    new Uint8Array(hntAccount.data),
                  )
                  const tokenAmount = BigInt(accInfo.amount)
                  return tokenAmount > 0n
                } catch {
                  // ignore token decode errors
                  return false
                }
              }
              return false
            }),
          )
        }
      } catch (error) {
        // Fill with defaults on error
        solBalances.push(...publicKeys.map(() => 0))
        hntBalances.push(...publicKeys.map(() => false))
      }

      return { solBalances, hntBalances }
    },
    [anchorProvider?.connection],
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
        const batchPublicKeys: PublicKey[] = []
        const batchAccountIndexes: number[] = []

        const currentBatchStart = batchStart
        // Process accounts sequentially to avoid Ledger device busy errors
        for (let i = 0; i < batchSize && currentBatchStart + i < 256; i += 1) {
          const accountIndex = currentBatchStart + i
          try {
            const derivationPath = getDerivationPath(
              accountIndex,
              derivationType,
            )
            const { address } = await solana.getAddress(derivationPath, false)
            const publicKey = new PublicKey(
              base58.encode(new Uint8Array(address)),
            )
            batchPublicKeys.push(publicKey)
            batchAccountIndexes.push(accountIndex)
          } catch (error) {
            // Skip invalid derivations
          }
        }

        if (batchPublicKeys.length === 0) break

        // Batch check balances for all accounts in this batch
        const { solBalances, hntBalances } = await checkBatchBalances(
          batchPublicKeys,
        )

        // Create account objects with balance info
        const batchAccounts = (
          await Promise.all(
            batchAccountIndexes.map(async (accountIndex, i) => {
              const balance = solBalances[i]
              const hasBalance = balance > 0 || hntBalances[i]
              const account = await createLedgerAccount(
                solana,
                accountIndex,
                derivationType,
                balance,
                hasBalance,
                batchPublicKeys[i], // Pass the already obtained public key
              )

              return account
            }),
          )
        ).filter(Boolean) as LedgerAccount[]

        const batchAccountsWithBalance = batchAccounts.filter(
          (acc) => acc.hasBalance,
        )

        // Add all accounts with balance from this batch
        if (batchAccountsWithBalance.length > 0) {
          accounts.push(...batchAccountsWithBalance)
        }

        // Special handling for first batch (0-9) if no accounts have balance
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

        // Continue to next batch only if current batch has accounts with balance
        if (batchAccountsWithBalance.length > 0) {
          batchStart += batchSize
        } else {
          break
        }
      }

      return accounts
    },
    [createLedgerAccount, checkBatchBalances],
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
        const derivationPath = getDerivationPath(-1, 'root')
        const { address } = await solana.getAddress(derivationPath, false)
        const publicKey = new PublicKey(base58.encode(new Uint8Array(address)))

        const { solBalances, hntBalances } = await checkBatchBalances([
          publicKey,
        ])
        const balance = solBalances[0] || 0
        const hasBalance = balance > 0 || hntBalances[0]

        const solanaRootAccount = await createLedgerAccount(
          solana,
          -1,
          'root',
          balance,
          hasBalance,
        )
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
      checkBatchBalances,
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
