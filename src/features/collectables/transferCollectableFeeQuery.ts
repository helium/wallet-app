import { AnchorProvider } from '@anchor-lang/core'
import { PublicKey } from '@solana/web3.js'
import { queryOptions } from '@tanstack/react-query'
import { Collectable, CompressedNFT } from '../../types/solana'
import * as Logger from '../../utils/logger'
import { createTransferCollectableMessage } from '../../utils/solanaUtils'

// The network fee to transfer the collectable and the wallet's SOL balance,
// both in lamports; null when the RPC gives no fee
export const transferCollectableFeeQuery = ({
  anchorProvider,
  solanaAddress,
  heliumAddress,
  collectable,
}: {
  anchorProvider?: AnchorProvider
  solanaAddress?: string
  heliumAddress: string
  collectable: Collectable | CompressedNFT
}) =>
  queryOptions({
    queryKey: [
      'transferCollectableFee',
      anchorProvider?.connection.rpcEndpoint,
      anchorProvider?.publicKey.toBase58(),
      solanaAddress,
      heliumAddress,
      (collectable as Collectable).address || (collectable as CompressedNFT).id,
    ],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const provider = anchorProvider!
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const payer = solanaAddress!
      try {
        const { message } = await createTransferCollectableMessage(
          provider,
          payer,
          heliumAddress,
          collectable,
          payer,
        )
        const response = await provider.connection.getFeeForMessage(
          message,
          'singleGossip',
        )
        if (!response?.value) return null

        const balance = await provider.connection.getBalance(
          new PublicKey(payer),
        )
        return { feeLamports: response.value, balanceLamports: balance }
      } catch (error) {
        Logger.error(error)
        throw error
      }
    },
    enabled: !!anchorProvider?.connection && !!solanaAddress,
    // The screen shows a failed read at once, as it did before; a retry
    // would show "calculating fee" for seconds first
    retry: false,
  })
