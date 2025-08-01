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
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
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
  hasBalance: boolean
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
    ): Promise<LedgerAccount | null> => {
      try {
        const { address } = await solana.getAddress(
          runDerivationScheme(accountIndex, useDefault),
          false,
        )
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

          // Check token balances (HNT, MOBILE, IOT)
          const tokenMints = [HNT_MINT, MOBILE_MINT, IOT_MINT]
          const ataAddresses = await Promise.all(
            tokenMints.map((mint) =>
              getAssociatedTokenAddress(mint, publicKey),
            ),
          )

          const tokenAccounts =
            await anchorProvider?.connection.getMultipleAccountsInfo(
              ataAddresses,
            )

          if (tokenAccounts) {
            tokenAccounts.forEach((account) => {
              if (account && account.data) {
                try {
                  const accInfo = AccountLayout.decode(
                    new Uint8Array(account.data),
                  )
                  const tokenAmount = BigInt(accInfo.amount)
                  if (tokenAmount > 0n) {
                    hasBalance = true
                  }
                } catch {
                  // ignore token decode errors
                }
              }
            })
          }
        } catch {
          // ignore balance check errors
        }

        const pathLabel =
          accountIndex === -1 ? 'Root' : useDefault ? 'Default' : 'Legacy'
        const aliasKey = accountIndex === -1 ? 'Root' : accountIndex + 1

        return {
          address: solAddressToHelium(bs58.encode(new Uint8Array(address))),
          balance,
          derivationPath: pathLabel,
          alias: `${t('ledger.show.alias', { accountIndex: aliasKey })}`,
          accountIndex,
          solanaAddress: bs58.encode(new Uint8Array(address)),
          hasBalance,
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
      )
      if (legacyAccount) accounts.push(legacyAccount)

      // Check default path: 44'/501'/x'/0'
      const defaultAccount = await createLedgerAccount(
        solana,
        accountIndex,
        true,
      )
      if (defaultAccount) accounts.push(defaultAccount)

      return accounts
    },
    [createLedgerAccount],
  )

  const getAllLedgerAccounts = useCallback(
    async (solana: AppSolana): Promise<LedgerAccount[]> => {
      const allAccounts: LedgerAccount[] = []
      for (let accountIndex = 0; accountIndex < 15; accountIndex += 1) {
        const accounts = await getLedgerAccountsForBothPaths(
          solana,
          accountIndex,
        )
        allAccounts.push(...accounts)

        // If no balance (SOL or tokens) found in this batch and we're past index 5, stop checking
        const hasAnyBalance = accounts.some((acc) => acc.hasBalance)
        if (!hasAnyBalance && accountIndex >= 5) {
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
      const accountsWithBalance = allAccounts.filter((acc) => acc.hasBalance)

      // Always include account 0 from each derivation path if they don't have balance
      const defaultAccount0 = allIndexedAccounts.find(
        (acc) =>
          acc.accountIndex === 0 && acc.derivationPath.includes('Default'),
      )

      const legacyAccount0 = allIndexedAccounts.find(
        (acc) =>
          acc.accountIndex === 0 && acc.derivationPath.includes('Legacy'),
      )

      const finalAccounts = [...accountsWithBalance]

      // Add account 0 from each path if not already included
      const addIfMissing = (
        account: LedgerAccount | undefined,
        pathName: string,
      ) => {
        if (
          account &&
          !accountsWithBalance.some(
            (acc) =>
              acc.accountIndex === 0 && acc.derivationPath.includes(pathName),
          )
        ) {
          finalAccounts.push(account)
        }
      }

      addIfMissing(defaultAccount0, 'Default')
      addIfMissing(legacyAccount0, 'Legacy')

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
      const mainAccounts: LedgerAccount[] = []

      // Check Solana root path (44'/501')
      try {
        const solanaRootAccount = await createLedgerAccount(solana, -1, false)
        if (solanaRootAccount) {
          mainAccounts.push(solanaRootAccount)
        }
      } catch {
        // ignore if derivation fails
      }

      // Start checking both derivation paths for each account index
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
