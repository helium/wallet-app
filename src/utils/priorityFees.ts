import { withPriorityFees as withPriorityFeesUtils } from '@helium/spl-utils'
import { Connection, TransactionInstruction } from '@solana/web3.js'
import { getBasePriorityFee } from './walletApiV2'

export async function withPriorityFees({
  connection,
  computeUnits,
  instructions,
}: {
  connection: Connection
  computeUnits: number
  instructions: TransactionInstruction[]
}): Promise<TransactionInstruction[]> {
  return withPriorityFeesUtils({
    connection,
    computeUnits,
    instructions,
    basePriorityFee: await getBasePriorityFee(),
  })
}
