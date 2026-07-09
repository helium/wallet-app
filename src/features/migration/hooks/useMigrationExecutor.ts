import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useCallback, useState } from 'react'
import { useSolana } from '../../../solana/SolanaProvider'
import {
  BatchStatus,
  deserializeBatchTxs,
  serializeSignedBatch,
  TransactionData,
} from '../logic/batches'
import { ExecutorProgress, runMigration, RunOutcome } from '../logic/executor'
import { MigrateInput, MigrationSession } from '../logic/session'
import { signBatchTransactions } from '../logic/signers'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 90000

export const useMigrationExecutor = (
  persist: (s: MigrationSession) => Promise<void>,
) => {
  const client = useBlockchainApi()
  const { anchorProvider } = useSolana()
  const solanaWallet = useEmbeddedSolanaWallet()
  const [progress, setProgress] = useState<ExecutorProgress>()

  const run = useCallback(
    async (input: MigrateInput): Promise<RunOutcome> => {
      if (!anchorProvider) throw new Error('Source wallet unavailable')
      if (
        solanaWallet.status !== 'connected' ||
        !solanaWallet.wallets?.length
      ) {
        throw new Error('Destination wallet unavailable')
      }

      const destProvider = await solanaWallet.wallets[0].getProvider()

      const signWithSource = (tx: VersionedTransaction) =>
        anchorProvider.wallet.signTransaction(tx)
      const signWithDestination = async (tx: VersionedTransaction) => {
        const { signedTransaction } = await destProvider.request({
          method: 'signTransaction',
          params: { transaction: tx },
        })
        return signedTransaction
      }

      const pollStatus = async (batchId: string): Promise<BatchStatus> => {
        const start = Date.now()
        // eslint-disable-next-line no-constant-condition
        while (true) {
          // eslint-disable-next-line no-await-in-loop
          const status = await client.transactions.get({
            id: batchId,
            commitment: 'confirmed',
          })
          if (status.status !== 'pending') return status
          if (Date.now() - start > POLL_TIMEOUT_MS) return status
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        }
      }

      return runMigration(input, {
        requestMigrate: (i) => client.migration.migrate(i),
        signBatch: (items, data) =>
          signBatchTransactions(
            deserializeBatchTxs(data as TransactionData).map((d, idx) => ({
              tx: d.tx,
              signers: items[idx].signers,
            })),
            { signWithSource, signWithDestination },
          ),
        submitBatch: (signed, data) =>
          client.transactions.submit(
            serializeSignedBatch(
              signed as VersionedTransaction[],
              data as TransactionData,
            ) as Parameters<typeof client.transactions.submit>[0],
          ),
        pollStatus,
        persist,
        onProgress: setProgress,
      })
    },
    [anchorProvider, solanaWallet, client, persist],
  )

  return { run, progress }
}
