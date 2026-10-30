import { Connection, PublicKey } from '@solana/web3.js'
import { queryOptions } from '@tanstack/react-query'
import { getAtaAccountCreationFee } from '../../../utils/solanaUtils'

// The rent the swap pays to open the wallet's token account for the output
// mint, or 0 when that account exists
export const ataCreationFeeQuery = ({
  connection,
  solanaAddress,
  mint,
}: {
  connection?: Connection
  solanaAddress?: string
  mint: PublicKey
}) =>
  queryOptions({
    queryKey: [
      'ataCreationFee',
      connection?.rpcEndpoint,
      solanaAddress,
      mint.toBase58(),
    ],
    queryFn: () =>
      getAtaAccountCreationFee({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        connection: connection!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        solanaAddress: solanaAddress!,
        mint,
      }),
    enabled: !!connection && !!solanaAddress,
  })
