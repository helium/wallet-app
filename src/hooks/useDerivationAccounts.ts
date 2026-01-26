import { Keypair as HeliumKeypair, Mnemonic } from '@helium/crypto-react-native'
import {
  Asset,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  truthy,
} from '@helium/spl-utils'
import { AccountLayout, getAssociatedTokenAddress } from '@solana/spl-token'
import { Keypair, PublicKey } from '@solana/web3.js'
import axios from 'axios'
import * as bip39 from 'bip39'
import { Buffer } from 'buffer'
import * as ed25519 from 'ed25519-hd-key'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Config from 'react-native-config'
import { retryWithBackoff } from '@utils/retryWithBackoff'
import { useSolana } from '../solana/SolanaProvider'

export const solanaDerivation = (account = -1, change: number | undefined) => {
  if (account === -1) {
    return "m/44'/501'" // main derivation path
  }
  if (typeof change !== 'undefined') {
    return `m/44'/501'/${account}'/${change}'` // sub derivation path
  }
  return `m/44'/501'/${account}'` // sub derivation path
}

const heliumDerivation = (account = -1) => {
  if (account === -1) {
    return "m/44'/904'" // main derivation path
  }
  return `m/44'/904'/${account}'/0'` // sub derivation path
}

export async function keypairFromSeed(
  seed: Buffer,
  derivationPath: string,
): Promise<Keypair | null> {
  try {
    const derivedSeed = ed25519.derivePath(
      derivationPath,
      seed.toString('hex'),
    ).key
    return Keypair.fromSeed(new Uint8Array(derivedSeed))
  } catch (e) {
    console.error(`Error deriving keypair at ${derivationPath}`, e)

    return null
  }
}

export type ResolvedPath = {
  derivationPath: string
  keypair: Keypair
  balance?: number
  tokens?: { mint: PublicKey; amount: bigint }[]
  nfts?: Asset[]
  needsMigrated?: boolean
}

export const HELIUM_DERIVATION = 'Helium L1'
export const MAIN_DERIVATION_PATHS = [
  HELIUM_DERIVATION,
  heliumDerivation(-1),
  heliumDerivation(0),
  solanaDerivation(-1, undefined),
]
export const useDerivationAccounts = ({ mnemonic }: { mnemonic?: string }) => {
  const { connection } = useSolana()
  const [resolvedGroups, setResolvedGroups] = useState<ResolvedPath[][]>([])
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMoreAccounts, setHasMoreAccounts] = useState(true)
  const derivationAccounts = useMemo(
    () => resolvedGroups.flat(),
    [resolvedGroups],
  )

  const solanaWithChange = (start: number, end: number) =>
    new Array(end - start).fill(0).map((_, i) => solanaDerivation(i + start, 0))

  const solanaWithoutChange = (start: number, end: number) =>
    new Array(end - start)
      .fill(0)
      .map((_, i) => solanaDerivation(i + start, undefined))

  const [groups, setGroups] = useState([
    [
      ...MAIN_DERIVATION_PATHS,
      ...solanaWithChange(0, 10),
      ...solanaWithoutChange(0, 10),
    ],
  ])

  // When mnemonic changes, reset resolved groups
  useEffect(() => {
    setResolvedGroups([])
    setHasMoreAccounts(true)
  }, [mnemonic])

  const seed = useMemo(() => {
    if (mnemonic) {
      return bip39.mnemonicToSeedSync(mnemonic, '')
    }
  }, [mnemonic])

  const fetchAccounts = useCallback(async () => {
    if (!seed || !connection) return
    if (!groups.some((_, i) => !resolvedGroups[i])) return
    if (!hasMoreAccounts) return

    setLoading(true)
    try {
      const resolved = await Promise.all(
        groups.map(async (group, index) => {
          if (resolvedGroups[index]) return resolvedGroups[index]
          return (
            await Promise.all(
              group.map(async (derivationPath) => {
                const keypair =
                  derivationPath === HELIUM_DERIVATION
                    ? Keypair.fromSecretKey(
                        new Uint8Array(
                          (
                            await HeliumKeypair.fromMnemonic(
                              new Mnemonic(mnemonic?.split(' ') || []),
                            )
                          ).privateKey,
                        ),
                      )
                    : await keypairFromSeed(seed, derivationPath)

                if (keypair) {
                  let needsMigrated = false
                  const ataMints = [HNT_MINT, MOBILE_MINT, IOT_MINT]
                  const atas = await Promise.all(
                    ataMints.map((mint) =>
                      getAssociatedTokenAddress(mint, keypair.publicKey),
                    ),
                  )

                  const [balance, tokens] = await Promise.all([
                    retryWithBackoff(() =>
                      connection.getBalance(keypair.publicKey),
                    ),
                    retryWithBackoff(() =>
                      connection.getMultipleAccountsInfo(atas),
                    ).then((tokenAccounts) =>
                      tokenAccounts
                        .map((acc, idx) => {
                          if (!acc) return null

                          const accInfo = AccountLayout.decode(
                            new Uint8Array(acc.data),
                          )
                          const amount = BigInt(accInfo.amount)
                          if (amount <= 0n) return null
                          return {
                            mint: ataMints[idx],
                            amount,
                          }
                        })
                        .filter((account) => account !== null),
                    ),
                  ])

                  if (derivationPath === heliumDerivation(-1)) {
                    const url = `${
                      Config.MIGRATION_SERVER_URL
                    }/migrate/${keypair.publicKey.toBase58()}`
                    // eslint-disable-next-line no-await-in-loop
                    const { transactions } = (await axios.get(url)).data
                    needsMigrated = transactions.length > 0
                  }

                  return {
                    derivationPath,
                    keypair,
                    balance,
                    tokens,
                    needsMigrated,
                  } as ResolvedPath
                }
              }),
            )
          ).filter(truthy)
        }),
      )

      // Check if the last group (the newly fetched one) has any accounts with balance or tokens
      const lastGroupIndex = resolved.length - 1
      const lastGroup = resolved[lastGroupIndex]
      const lastGroupHasAccounts = lastGroup?.some(
        (acc) => (acc?.balance || 0) > 0 || (acc?.tokens?.length || 0) > 0,
      )

      // If we're past the first group and the last group has no accounts, stop fetching
      if (lastGroupIndex > 0 && !lastGroupHasAccounts) {
        setHasMoreAccounts(false)
      }

      setResolvedGroups(resolved)
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [seed, groups, connection, resolvedGroups, mnemonic, hasMoreAccounts])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    error,
    loading,
    derivationAccounts,
    fetchMore: () => {
      if (hasMoreAccounts) {
        setGroups([
          ...groups,
          [
            ...solanaWithChange(groups.length * 10, groups.length * 10 + 10),
            ...solanaWithoutChange(groups.length * 10, groups.length * 10 + 10),
          ],
        ])
      }
    },
  }
}
