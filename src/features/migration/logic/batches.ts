import { VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import { SignerRole } from './types'

export type MigrateTxData = {
  serializedTransaction: string
  metadata?: {
    type?: string
    description?: string
    signers?: SignerRole[]
  } & Record<string, unknown>
}

export type TransactionData = {
  transactions: MigrateTxData[]
  parallel: boolean
  tag?: string
}

export type BatchStatus = {
  status: 'pending' | 'confirmed' | 'failed' | 'expired' | 'partial'
  transactions: { signature: string; status: string }[]
}

export const deserializeBatchTxs = (
  data: TransactionData,
): { tx: VersionedTransaction; signers: SignerRole[] }[] =>
  data.transactions.map((t) => ({
    tx: VersionedTransaction.deserialize(
      Buffer.from(t.serializedTransaction, 'base64'),
    ),
    signers: t.metadata?.signers?.length
      ? t.metadata.signers
      : (['source'] as SignerRole[]),
  }))

export const serializeSignedBatch = (
  signed: VersionedTransaction[],
  data: TransactionData,
) => ({
  parallel: data.parallel,
  tag: data.tag,
  transactions: signed.map((tx, i) => ({
    serializedTransaction: Buffer.from(tx.serialize()).toString('base64'),
    metadata: data.transactions[i]?.metadata,
  })),
})

export const summarizeBatch = (
  status: BatchStatus,
): { confirmedSignatures: string[]; failedSignatures: string[] } => {
  const confirmedSignatures: string[] = []
  const failedSignatures: string[] = []
  for (const t of status.transactions) {
    if (t.status === 'confirmed') confirmedSignatures.push(t.signature)
    else failedSignatures.push(t.signature)
  }
  return { confirmedSignatures, failedSignatures }
}
