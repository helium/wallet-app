import { Connection, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { queryOptions } from '@tanstack/react-query'
import { getAtaAccountCreationFee } from '../../../utils/solanaUtils'

// The rent the swap pays to open the wallet's token account for the output
// mint, or 0 when that account exists
export const ataCreationFeeQuery = ({
  connection,
  solanaAddress,
  mint,
  solBalance,
}: {
  connection?: Connection
  solanaAddress?: string
  mint: PublicKey
  solBalance?: BN
}) =>
  queryOptions({
    queryKey: [
      'ataCreationFee',
      connection?.rpcEndpoint,
      solanaAddress,
      mint.toBase58(),
      // A swap that opens the account also spends SOL, so a new balance re-reads the fee
      solBalance?.toString(),
    ],
    queryFn: () =>
      getAtaAccountCreationFee({
        connection: connection!,
        solanaAddress: solanaAddress!,
        mint,
      }),
    enabled: !!connection && !!solanaAddress,
  })
