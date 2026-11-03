import { useAccounts } from '@helium/account-fetch-cache-hooks'
import { MintParser, useSolOwnedAmount } from '@helium/helium-react-hooks'
import {
  useHeliumVsrState,
  usePositions,
} from '@helium/voter-stake-registry-hooks'
import {
  getPositionKeysForOwner,
  getRegistrarKey,
} from '@helium/voter-stake-registry-sdk'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadatas, useStableKeys } from '@hooks/useMetaplexMetadata'
import usePrevious from '@hooks/usePrevious'
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  unpackAccount,
} from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { UseQueryResult, useQueries } from '@tanstack/react-query'
import BN from 'bn.js'
import { useCallback, useMemo } from 'react'
import { useSolana } from '../../solana/SolanaProvider'

const tokenAccountParser = (pubkey: PublicKey, account: AccountInfo<Buffer>) =>
  unpackAccount(pubkey, account)

export type TokenRowData = {
  symbol?: string
  image?: string
  loadingMetadata: boolean
  amount?: bigint
  decimals?: number
  loadingOwned: boolean
}

export type LockedRowData = {
  amountLocked?: BN
  loadingAmount: boolean
}

// The metadata, balance and decimals of each mint of a token list, read once
// for the whole list. Keyed by mint address.
export const useTokenRows = (
  mintsIn: PublicKey[],
): Record<string, TokenRowData> => {
  const wallet = useCurrentWallet()
  const mints = useStableKeys(mintsIn)
  const metadata = useMetaplexMetadatas(mints)
  const { amount: solAmount } = useSolOwnedAmount(wallet)

  const walletStr = wallet?.toBase58()
  const ataKeys = useMemo(
    () =>
      walletStr
        ? mints.map((mint) =>
            getAssociatedTokenAddressSync(mint, new PublicKey(walletStr), true),
          )
        : undefined,
    [mints, walletStr],
  )
  const { accounts: atas, loading: loadingAtas } = useAccounts(
    ataKeys,
    tokenAccountParser,
  )
  const { accounts: mintAccs, loading: loadingMints } = useAccounts(
    mints,
    MintParser,
  )

  return mints.reduce(
    (acc, mint, index) => {
      const mintStr = mint.toBase58()
      const ataKey = ataKeys?.[index]
      const ata = ataKey
        ? atas?.find((a) => a.publicKey.equals(ataKey))?.info
        : undefined
      const mintAcc = mintAccs?.find((a) => a.publicKey.equals(mint))?.info
      const { json, symbol, loading } = metadata[mintStr] ?? {}
      acc[mintStr] = {
        symbol,
        image: json?.image,
        loadingMetadata: !!loading,
        amount: mint.equals(NATIVE_MINT) ? solAmount : ata?.amount,
        decimals: mintAcc?.decimals,
        loadingOwned:
          (loadingAtas && ata === undefined) ||
          (loadingMints && mintAcc === undefined),
      }
      return acc
    },
    {} as Record<string, TokenRowData>,
  )
}

// The tokens the wallet holds in voting positions, for each governance mint
// of a token list. The governance context already holds the positions of its
// own mint; the position keys of each other mint are read in its own query.
export const useLockedAmounts = (
  mintsIn: PublicKey[],
): Record<string, LockedRowData> => {
  const { connection } = useSolana()
  const wallet = useCurrentWallet()
  const mints = useStableKeys(mintsIn)
  const {
    positions: contextPositions,
    mint: govMint,
    loading: loadingContext,
  } = useHeliumVsrState()

  const govMintStr = govMint?.toBase58()
  const otherMints = useMemo(
    () => mints.filter((mint) => mint.toBase58() !== govMintStr),
    [mints, govMintStr],
  )
  const walletStr = wallet?.toBase58()

  // One query per mint: a failed mint retries on its own, and the other
  // mints keep their keys
  const combinePositionKeys = useCallback(
    (results: UseQueryResult<PublicKey[]>[]) => ({
      keysByMint: results.some((result) => result.data)
        ? otherMints.reduce(
            (acc, mint, index) => {
              const { data } = results[index]
              if (data) acc[mint.toBase58()] = data
              return acc
            },
            {} as Record<string, PublicKey[]>,
          )
        : undefined,
      loadingPositionKeys: results.some((result) => result.isLoading),
    }),
    [otherMints],
  )
  const { keysByMint, loadingPositionKeys } = useQueries({
    queries: otherMints.map((mint) => {
      const registrar = getRegistrarKey(mint)
      return {
        queryKey: [
          'positionKeysForOwner',
          connection?.rpcEndpoint,
          registrar.toBase58(),
          walletStr,
        ],
        queryFn: async () => {
          if (!walletStr || !connection) return []
          try {
            const { positions } = await getPositionKeysForOwner({
              registrar,
              owner: new PublicKey(walletStr),
              connection,
            })
            return positions
          } catch (e) {
            console.warn(`Position keys for mint ${mint.toBase58()} failed`, e)
            throw e
          }
        },
        enabled: !!walletStr && !!connection,
        staleTime: 0,
      }
    }),
    combine: combinePositionKeys,
  })

  // The same key list while the keys stay the same: a refetch with the same
  // keys does not restart the position read
  const positionKeysStr = keysByMint
    ? Object.values(keysByMint)
        .flat()
        .map((key) => key.toBase58())
        .join(',')
    : undefined
  const positionKeys = useMemo(() => {
    if (positionKeysStr === undefined) return undefined
    return positionKeysStr
      ? positionKeysStr.split(',').map((key) => new PublicKey(key))
      : []
  }, [positionKeysStr])
  const { accounts: fetchedPositions, loading: loadingFetchedPositions } =
    usePositions(positionKeys)

  const amountsLocked = mints.reduce(
    (acc, mint) => {
      const mintStr = mint.toBase58()
      const isContextMint = mintStr === govMintStr
      const keys = keysByMint?.[mintStr]
      const positions = isContextMint
        ? contextPositions
        : fetchedPositions
            ?.filter((fetched) =>
              keys?.some((key) => key.equals(fetched.publicKey)),
            )
            .map((fetched) => fetched.info)

      if (positions && positions.length) {
        let amountLocked = new BN(0)
        positions.forEach((position) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (position && !position.isProxiedToMe) {
            amountLocked = amountLocked.add(position.amountDepositedNative)
          }
        })
        acc[mintStr] = amountLocked
      }
      return acc
    },
    {} as Record<string, BN | undefined>,
  )
  const prevLocked = usePrevious(amountsLocked)

  return mints.reduce(
    (acc, mint) => {
      const mintStr = mint.toBase58()
      const loading =
        mintStr === govMintStr
          ? loadingContext
          : loadingPositionKeys || loadingFetchedPositions || loadingContext
      acc[mintStr] = {
        amountLocked: amountsLocked[mintStr],
        loadingAmount: !prevLocked?.[mintStr] && loading,
      }
      return acc
    },
    {} as Record<string, LockedRowData>,
  )
}
