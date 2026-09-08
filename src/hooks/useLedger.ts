import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { useCallback, useRef, useState } from 'react'
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
  classifyLedgerError,
  getDerivationPath,
  getDerivationPathLabel,
  isRetryableReconnectError,
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

type LedgerTransport = TransportBLE | TransportHID

export const BLE_CONNECT_TIMEOUT_MS = 10_000
const RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 1_000
const DISCONNECT_WAIT_MS = 1_500
const APP_READY_ATTEMPTS = 10
const APP_READY_DELAY_MS = 200

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

// Resolves on the transport's disconnect event, or after ms if it never comes.
const waitForDisconnect = (transport: LedgerTransport, ms: number) =>
  new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer)
      transport.off('disconnect', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    transport.on('disconnect', done)
  })

const useLedger = () => {
  // BLE transports are cached by the library and evicted on disconnect, so
  // TransportBLE.open is safe to call on every use. HID has no such cache, so
  // keep the open USB transport here until it disconnects.
  const usbTransport = useRef<
    { transport: TransportHID; deviceId: string } | undefined
  >(undefined)
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [ledgerAccountsLoading, setLedgerAccountsLoading] = useState(false)
  const { t } = useTranslation()
  const { anchorProvider, connection } = useSolana()

  const openSolanaApp = useCallback(async (trans: LedgerTransport) => {
    await trans.send(
      0xe0,
      0xd8,
      0x00,
      0x00,
      Buffer.from(ManagerAppName, 'utf8'),
    )
  }, [])

  const waitForSolanaApp = useCallback(
    async (trans: LedgerTransport, maxAttempts = APP_READY_ATTEMPTS) => {
      const solana = new AppSolana(trans)

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await solana.getAppConfiguration()
          return
        } catch (error) {
          if (classifyLedgerError(error) !== 'appNotOpen') {
            throw error
          }
          // eslint-disable-next-line no-await-in-loop
          await delay(APP_READY_DELAY_MS)
        }
      }

      throw new Error('Solana app did not become ready within expected time')
    },
    [],
  )

  const closeUsbTransport = useCallback(() => {
    const { current } = usbTransport
    usbTransport.current = undefined
    current?.transport.close().catch(() => {})
  }, [])

  const getTransport = useCallback(
    async (
      nextDeviceId: string,
      type: 'usb' | 'bluetooth',
    ): Promise<LedgerTransport | undefined> => {
      if (type === 'bluetooth') {
        return TransportBLE.open(nextDeviceId, BLE_CONNECT_TIMEOUT_MS)
      }

      const cached = usbTransport.current
      if (cached?.deviceId === nextDeviceId) {
        return cached.transport
      }
      if (cached) {
        closeUsbTransport()
      }

      await TransportHID.create()
      const devices = await TransportHID.list()
      const device = devices.find(
        (d) => d.deviceId === parseInt(nextDeviceId, 10),
      )
      if (!device) return
      const newTransport = await TransportHID.open(device)
      if (!newTransport) return

      newTransport.on('disconnect', () => {
        if (usbTransport.current?.transport === newTransport) {
          usbTransport.current = undefined
        }
      })
      usbTransport.current = { transport: newTransport, deviceId: nextDeviceId }
      return newTransport
    },
    [closeUsbTransport],
  )

  // After the open-app APDU the device re-enumerates. Wait for the drop, then
  // reopen the transport with retries until the Solana app answers. The BLE
  // cache may hand back the dying transport if the drop arrives late, so a
  // disconnect from getAppConfiguration is retried here too.
  const reconnectAfterAppOpen = useCallback(
    async (
      previous: LedgerTransport,
      nextDeviceId: string,
      type: 'usb' | 'bluetooth',
    ): Promise<LedgerTransport> => {
      await waitForDisconnect(previous, DISCONNECT_WAIT_MS)

      let lastError: unknown = new Error('Transport could not be created')
      for (let attempt = 1; attempt <= RECONNECT_ATTEMPTS; attempt += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const next = await getTransport(nextDeviceId, type)
          if (!next) throw new Error('Transport could not be created')
          // eslint-disable-next-line no-await-in-loop
          await waitForSolanaApp(next)
          return next
        } catch (error) {
          if (!isRetryableReconnectError(error)) throw error
          lastError = error
          // eslint-disable-next-line no-await-in-loop
          await delay(RECONNECT_DELAY_MS)
        }
      }

      throw lastError
    },
    [getTransport, waitForSolanaApp],
  )

  const createLedgerAccount = useCallback(
    async (
      solana: AppSolana,
      accountIndex: number,
      derivationType: DerivationType,
      balance?: number,
      hasBalance?: boolean,
      publicKey?: PublicKey,
    ): Promise<LedgerAccount | null> => {
      try {
        const derivationPath = getDerivationPath(accountIndex, derivationType)
        let address: Uint8Array
        if (publicKey) {
          address = publicKey.toBytes()
        } else {
          const result = await solana.getAddress(derivationPath, false)
          address = result.address
        }

        const pathLabel =
          accountIndex === -1 ? 'Root' : getDerivationPathLabel(derivationType)
        const aliasKey = accountIndex === -1 ? 'Root' : accountIndex + 1

        const account = {
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

        return account
      } catch (error) {
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
      const rpcConnection = anchorProvider?.connection ?? connection

      if (!rpcConnection) {
        return {
          solBalances: publicKeys.map(() => 0),
          hntBalances: publicKeys.map(() => false),
        }
      }

      try {
        // Batch check SOL balances
        const accountInfos = await rpcConnection.getMultipleAccountsInfo(
          publicKeys,
        )

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

        const hntAccountInfos = await rpcConnection.getMultipleAccountsInfo(
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
    [anchorProvider?.connection, connection],
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

        if (batchPublicKeys.length === 0) {
          break
        }

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
                batchPublicKeys[i],
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
      setLedgerAccountsLoading(true)

      try {
        const nextTransport = await getTransport(device.id, device.type)
        if (!nextTransport) {
          throw new Error('Transport could not be created')
        }

        const solana = new AppSolana(nextTransport)
        const mainAccounts: LedgerAccount[] = []

        // Check Solana root path (44'/501')
        try {
          const derivationPath = getDerivationPath(-1, 'root')
          const { address } = await solana.getAddress(derivationPath, false)
          const publicKey = new PublicKey(
            base58.encode(new Uint8Array(address)),
          )

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
        } catch (error) {
          // ignore if derivation fails
        }

        // Start checking all derivation paths for each account index
        await getLedgerAccounts(solana, mainAccounts)
      } catch (error) {
        closeUsbTransport()
        throw error
      } finally {
        setLedgerAccountsLoading(false)
      }
    },
    [
      createLedgerAccount,
      getLedgerAccounts,
      getTransport,
      closeUsbTransport,
      ledgerAccountsLoading,
      checkBatchBalances,
    ],
  )

  return {
    getTransport,
    reconnectAfterAppOpen,
    ledgerAccounts,
    updateLedgerAccounts,
    ledgerAccountsLoading,
    openSolanaApp,
    waitForSolanaApp,
  }
}

export default useLedger
