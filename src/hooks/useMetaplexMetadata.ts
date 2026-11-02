import { TypedAccountParser } from '@helium/account-fetch-cache'
import {
  PROGRAM_ID as MPL_PID,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { NATIVE_MINT } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useMemo } from 'react'
import { useAccount, useAccounts } from '@helium/account-fetch-cache-hooks'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: Partial<Record<string, Promise<any>>> = {}
export function getMetadata(
  uriIn: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | undefined> {
  const uri = uriIn?.replace(/\0/g, '')
  if (uri) {
    if (!cache[uri]) {
      // Force HTTPS for security - convert any HTTP URLs to HTTPS
      const secureUri = uri.replace(/^http:\/\//, 'https://')
      cache[uri] = axios
        .get(secureUri, {
          timeout: 3000,
        })
        .then((res) => res.data)
        .catch((err: unknown) => {
          console.error(`Error at uri ${uri}`, err)
        })
    }
    return cache[uri]
  }
  return Promise.resolve(undefined)
}

export const METADATA_PARSER: TypedAccountParser<Metadata> = (
  _: PublicKey,
  account: AccountInfo<Buffer>,
) => {
  return Metadata.fromAccountInfo(account)[0]
}

export function getMetadataId(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata', 'utf-8'), MPL_PID.toBuffer(), mint.toBuffer()],
    MPL_PID,
  )[0]
}

type TokenInfo = {
  name: string
  symbol: string
  logoURI: string
}

export const tokenInfoToMetadata = (
  tokenInfo: TokenInfo | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | undefined => {
  if (!tokenInfo) return undefined

  return {
    json: {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      image: tokenInfo.logoURI,
    },
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
  }
}

const USDC = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

type MetaplexMetadata = {
  loading: boolean
  metadata: Metadata | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any | undefined
  symbol: string | undefined
  name: string | undefined
}

const SOL_METADATA: MetaplexMetadata = {
  metadata: undefined,
  loading: false,
  json: {
    name: 'SOL',
    symbol: 'SOL',
    image:
      'https://github.com/solana-labs/token-list/blob/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png?raw=true',
  },
  symbol: 'SOL',
  name: 'SOL',
}

const USDC_METADATA: MetaplexMetadata = {
  metadata: undefined,
  loading: false,
  json: {
    name: 'USDC',
    symbol: 'USDC',
    image:
      'https://github.com/solana-labs/token-list/blob/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png?raw=true',
  },
  symbol: 'USDC',
  name: 'USDC',
}

// SOL and USDC have no metaplex metadata account.
const knownMetadata = (mint: PublicKey | undefined) => {
  if (mint?.equals(NATIVE_MINT)) return SOL_METADATA
  if (mint?.equals(USDC)) return USDC_METADATA
  return undefined
}

export function useMetaplexMetadata(
  mint: PublicKey | undefined,
): MetaplexMetadata {
  const mintStr = mint?.toBase58()
  const metadataAddr = useMemo(() => {
    if (mintStr) {
      return getMetadataId(new PublicKey(mintStr))
    }
  }, [mintStr])

  const { info: metadataAcc, loading } = useAccount(
    metadataAddr,
    METADATA_PARSER,
  )

  const uri = metadataAcc?.data.uri.trim()
  const { data, isLoading: jsonLoading } = useQuery({
    queryKey: ['metaplexJson', uri],
    queryFn: async () => (await getMetadata(uri)) ?? null,
    enabled: !!uri,
  })
  const json = data ?? undefined

  const known = knownMetadata(mint)
  if (known) return known

  return {
    loading: jsonLoading || loading,
    json,
    metadata: metadataAcc,
    symbol: json?.symbol || metadataAcc?.data?.symbol,
    name: json?.name || metadataAcc?.data?.name,
  }
}

// The metadata of many mints in one account read, for a list. Each JSON uses
// the same per-URI query as useMetaplexMetadata, so the two share a cache and
// each mint loads on its own.
export function useMetaplexMetadatas(
  mints: PublicKey[],
): Record<string, MetaplexMetadata> {
  const mintsKey = mints.map((m) => m.toBase58()).join(',')
  const mintKeys = useMemo(
    () => (mintsKey ? mintsKey.split(',').map((m) => new PublicKey(m)) : []),
    [mintsKey],
  )
  const metadataAddrs = useMemo(
    () => mintKeys.map((m) => getMetadataId(m)),
    [mintKeys],
  )
  const { accounts, loading } = useAccounts(metadataAddrs, METADATA_PARSER)
  const metadataAccs = mintKeys.map(
    (_, index) =>
      accounts?.find((a) => a.publicKey.equals(metadataAddrs[index]))?.info,
  )
  const jsons = useQueries({
    queries: metadataAccs.map((metadataAcc) => {
      const uri = metadataAcc?.data.uri.trim()
      return {
        queryKey: ['metaplexJson', uri],
        queryFn: async () => (await getMetadata(uri)) ?? null,
        enabled: !!uri,
      }
    }),
  })

  return mintKeys.reduce(
    (acc, mint, index) => {
      const metadataAcc = metadataAccs[index]
      const json = jsons[index]?.data ?? undefined
      acc[mint.toBase58()] = knownMetadata(mint) ?? {
        loading:
          !!jsons[index]?.isLoading || (loading && metadataAcc === undefined),
        json,
        metadata: metadataAcc,
        symbol: json?.symbol || metadataAcc?.data?.symbol,
        name: json?.name || metadataAcc?.data?.name,
      }
      return acc
    },
    {} as Record<string, MetaplexMetadata>,
  )
}
