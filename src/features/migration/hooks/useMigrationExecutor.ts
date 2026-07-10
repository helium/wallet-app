import { TERMINAL_STATUSES } from '@hooks/useTransactionBatchStatus'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import sleep from '@utils/sleep'
import { useCallback, useState } from 'react'
import { useSolana } from '../../../solana/SolanaProvider'
import {
  BatchStatus,
  deserializeBatchTxs,
  serializeSignedBatch,
} from '../logic/batches'
import {
  ExecutorProgress,
  RunOptions,
  runMigration,
  RunOutcome,
} from '../logic/executor'
import { getEmbeddedWallet } from '../logic/embeddedWallet'
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
    async (input: MigrateInput, opts?: RunOptions): Promise<RunOutcome> => {
      if (!anchorProvider) throw new Error('Source wallet unavailable')
      const destWallet = getEmbeddedWallet(solanaWallet)
      if (!destWallet) throw new Error('Destination wallet unavailable')

      // Clear any prior attempt's phase so a retry never flashes stale progress.
      setProgress(undefined)

      const destProvider = await destWallet.getProvider()

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
          if (TERMINAL_STATUSES.includes(status.status)) return status
          if (Date.now() - start > POLL_TIMEOUT_MS) return status
          // eslint-disable-next-line no-await-in-loop
          await sleep(POLL_INTERVAL_MS)
        }
      }

      return runMigration<VersionedTransaction>(
        input,
        {
          requestMigrate: (i) => client.migration.migrate(i),
          signBatch: (data) =>
            signBatchTransactions(deserializeBatchTxs(data), {
              signWithSource,
              signWithDestination,
            }),
          submitBatch: (signed, data) =>
            client.transactions.submit(serializeSignedBatch(signed, data)),
          pollStatus,
          persist,
          onProgress: setProgress,
        },
        opts,
      )
    },
    [anchorProvider, solanaWallet, client, persist],
  )

  return { run, progress }
}
