import { TypedAccountParser } from '@helium/account-fetch-cache'
import { useAccount } from '@helium/account-fetch-cache-hooks'
import {
  Metadata,
  parseMetadataAccount,
  sol,
  toMetadata,
} from '@metaplex-foundation/js'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'

const MPL_PID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

const cache: Record<string, any> = {}
async function getMetadata(uri: string | undefined): Promise<any | undefined> {
  if (uri) {
    if (!cache[uri]) {
      const res = await fetch(uri)
      const json = await res.json()
      cache[uri] = json
    }
    return cache[uri]
  }
}

export function useMetaplexMetadata(mint: PublicKey | undefined): {
  loading: boolean
  metadata: Metadata | undefined
  json: any | undefined
  symbol: string | undefined
  name: string | undefined
} {
  const metadataAddr = useMemo(() => {
    if (mint) {
      return PublicKey.findProgramAddressSync(
        [Buffer.from('metadata', 'utf-8'), MPL_PID.toBuffer(), mint.toBuffer()],
        MPL_PID,
      )[0]
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mint?.toBase58()])
  const parser: TypedAccountParser<Metadata> = useMemo(() => {
    return (publicKey, account) => {
      return toMetadata(
        parseMetadataAccount({
          ...account,
          lamports: sol(account.lamports),
          data: account.data,
          publicKey,
        }),
      )
    }
  }, [])
  const { info: metadataAcc, loading } = useAccount(metadataAddr, parser)
  const { result: json, loading: jsonLoading } = useAsync(getMetadata, [
    metadataAcc?.uri,
  ])

  return {
    loading: jsonLoading || loading,
    json,
    metadata: metadataAcc,
    symbol: json?.symbol || metadataAcc?.symbol,
    name: json?.name || metadataAcc?.name,
  }
}
