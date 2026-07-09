import { VersionedTransaction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import { signersOrDefault } from './signers'
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
    signers: signersOrDefault(t.metadata),
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
): {
  confirmedSignatures: string[]
  failedSignatures: string[]
  pendingSignatures: string[]
} => {
  const confirmedSignatures = status.transactions
    .filter((t) => t.status === 'confirmed')
    .map((t) => t.signature)
  // A still-'pending' tx has not failed — a poll can time out with the
  // network still confirming. Counting it as failed would push the user to a
  // false-failure retry screen. Only terminal statuses count as failed.
  const pendingSignatures = status.transactions
    .filter((t) => t.status === 'pending')
    .map((t) => t.signature)
  const failedSignatures = status.transactions
    .filter((t) => t.status !== 'confirmed' && t.status !== 'pending')
    .map((t) => t.signature)
  return { confirmedSignatures, failedSignatures, pendingSignatures }
}
