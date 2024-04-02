import {
  TransactionDraft,
  withPriorityFees as withPriorityFeesUtils,
} from '@helium/spl-utils'
import { Connection, TransactionInstruction } from '@solana/web3.js'
import { getBasePriorityFee } from './walletApiV2'

export async function withPriorityFees({
  connection,
  computeUnits,
  instructions,
  computeScaleUp,
  ...rest
}: {
  connection: Connection
  computeUnits?: number
  computeScaleUp?: number
  instructions: TransactionInstruction[]
} & TransactionDraft): Promise<TransactionInstruction[]> {
  return withPriorityFeesUtils({
    ...rest,
    connection,
    computeUnits,
    instructions,
    computeScaleUp,
    basePriorityFee: await getBasePriorityFee(),
  })
}
