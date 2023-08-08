import { TypedAccountParser } from '@helium/account-fetch-cache'
import { useAccount } from '@helium/account-fetch-cache-hooks'
import {
  Metadata,
  parseMetadataAccount,
  sol,
  toMetadata,
} from '@metaplex-foundation/js'
import { NATIVE_MINT } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'

const MPL_PID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache: Record<string, Promise<any>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMetadata(uri: string | undefined): Promise<any | undefined> {
  if (uri) {
    if (!cache[uri]) {
      cache[uri] = fetch(uri).then((res) => res.json())
    }
    return cache[uri]
  }
  return Promise.resolve(undefined)
}

export const METADATA_PARSER: TypedAccountParser<Metadata> = (
  publicKey: PublicKey,
  account: AccountInfo<Buffer>,
) => {
  return toMetadata(
    parseMetadataAccount({
      ...account,
      lamports: sol(account.lamports),
      data: account.data,
      publicKey,
    }),
  )
}

export function getMetadataId(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata', 'utf-8'), MPL_PID.toBuffer(), mint.toBuffer()],
    MPL_PID,
  )[0]
}

export function useMetaplexMetadata(mint: PublicKey | undefined): {
  loading: boolean
  metadata: Metadata | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any | undefined
  symbol: string | undefined
  name: string | undefined
} {
  const metadataAddr = useMemo(() => {
    if (mint) {
      return getMetadataId(mint)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mint?.toBase58()])

  const { info: metadataAcc, loading } = useAccount(
    metadataAddr,
    METADATA_PARSER,
    true,
  )
  const { result: json, loading: jsonLoading } = useAsync(getMetadata, [
    metadataAcc?.uri,
  ])

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

  return {
    loading: jsonLoading || loading,
    json,
    metadata: metadataAcc,
    symbol: json?.symbol || metadataAcc?.symbol,
    name: json?.name || metadataAcc?.name,
  }
}
