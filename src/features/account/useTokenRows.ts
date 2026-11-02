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
import { useMetaplexMetadatas } from '@hooks/useMetaplexMetadata'
import usePrevious from '@hooks/usePrevious'
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  unpackAccount,
} from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import BN from 'bn.js'
import { useMemo } from 'react'
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

// The same PublicKey list while the mints stay the same, so the account
// reads below do not restart on each render.
const useStableKeys = (mints: PublicKey[]) => {
  const mintsKey = mints.map((m) => m.toBase58()).join(',')
  return useMemo(
    () => (mintsKey ? mintsKey.split(',').map((m) => new PublicKey(m)) : []),
    [mintsKey],
  )
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
// own mint; the positions of the other mints are read in one query.
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

  const { data: keysByMint, isLoading: loadingPositionKeys } = useQuery({
    queryKey: [
      'positionKeysForOwner',
      connection?.rpcEndpoint,
      otherMints.map((mint) => getRegistrarKey(mint).toBase58()),
      walletStr,
    ],
    queryFn: async () => {
      if (!walletStr || !connection) return null
      const results = await Promise.all(
        otherMints.map((mint) =>
          getPositionKeysForOwner({
            registrar: getRegistrarKey(mint),
            owner: new PublicKey(walletStr),
            connection,
          }),
        ),
      )
      return otherMints.reduce(
        (acc, mint, index) => {
          acc[mint.toBase58()] = results[index].positions
          return acc
        },
        {} as Record<string, PublicKey[]>,
      )
    },
    enabled: !!walletStr && !!connection && otherMints.length > 0,
    staleTime: 0,
  })

  const positionKeys = useMemo(
    () => (keysByMint ? Object.values(keysByMint).flat() : undefined),
    [keysByMint],
  )
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
