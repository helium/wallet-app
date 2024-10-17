import { TypedAccountParser } from '@helium/account-fetch-cache'
import {
  PROGRAM_ID as MPL_PID,
  Metadata,
} from '@metaplex-foundation/mpl-token-metadata'
import { NATIVE_MINT } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import axios from 'axios'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useAccount } from '@helium/account-fetch-cache-hooks'
import { useSelector } from 'react-redux'
import { RootState } from '@store/rootReducer'
import { useAppDispatch } from '@store/store'
import { tokensSlice } from '@store/slices/tokensSlice'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: Record<string, Promise<any>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMetadata(
  uriIn: string | undefined,
): Promise<any | undefined> {
  const uri = uriIn?.replace(/\0/g, '')
  if (uri) {
    if (!cache[uri]) {
      cache[uri] = axios
        .get(uri.replace(/\0/g, ''), {
          timeout: 3000,
        })
        .then((res) => res.data)
        .catch((err: any) => {
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
export function useMetaplexMetadata(mint: PublicKey | undefined): {
  loading: boolean
  metadata: Metadata | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any | undefined
  symbol: string | undefined
  name: string | undefined
} {
  const dispatch = useAppDispatch()
  const { tokens } = useSelector((state: RootState) => state.tokens)

  const cachedToken = useMemo(() => {
    if (mint) {
      return tokens[mint.toBase58()]
    }
    return undefined
  }, [mint, tokens])

  const metadataAddr = useMemo(() => {
    if (mint) {
      return getMetadataId(mint)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mint?.toBase58()])

  const { info: metadataAcc, loading } = useAccount(
    metadataAddr,
    METADATA_PARSER,
  )

  const { result: json, loading: jsonLoading } = useAsync(async () => {
    if (!mint) return
    const meta = await getMetadata(metadataAcc?.data.uri.trim())

    dispatch(
      tokensSlice.actions.setToken({
        mint: mint.toBase58(),
        name: meta?.name,
        symbol: meta?.symbol,
        img: meta?.image,
      }),
    )
    return meta
  }, [mint, dispatch, metadataAcc])

  if (mint?.equals(NATIVE_MINT)) {
    return {
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
  }

  if (mint?.equals(USDC)) {
    return {
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
  }

  if (cachedToken) {
    return {
      metadata: undefined,
      loading: false,
      json: {
        name: cachedToken.name,
        symbol: cachedToken.symbol,
        image: cachedToken.img,
      },
      symbol: cachedToken.symbol,
      name: cachedToken.name,
    }
  }

  return {
    loading: jsonLoading || loading,
    json,
    metadata: metadataAcc,
    symbol: json?.symbol || metadataAcc?.data?.symbol,
    name: json?.name || metadataAcc?.data?.name,
  }
}
