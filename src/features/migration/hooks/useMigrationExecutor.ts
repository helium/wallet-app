import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { createBatchView } from '@utils/batchSubmit'
import sleep from '@utils/sleep'
import bs58 from 'bs58'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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

// tsc resolves this project's Connection to the web3.js 1.77.4 typings nested
// under jito-ts, which lack isBlockhashValid. The bundled 1.99.0 class has it.
type BlockhashProbe = {
  isBlockhashValid: (
    blockhash: string,
    config: { commitment: 'confirmed' },
  ) => Promise<{ value: boolean }>
}

export const useMigrationExecutor = (
  persist: (s: MigrationSession) => Promise<void>,
) => {
  const { t } = useTranslation()
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
        const view = createBatchView()
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const status = view(
            // eslint-disable-next-line no-await-in-loop
            await client.transactions.get({
              id: batchId,
              commitment: 'confirmed',
            }),
          )
          if (status.status !== 'pending') return status
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
          emptyPageMessage: t('migrateToWorld.errors.emptyPage'),
          // The server stores the same value as each transaction's signature.
          describeSigned: (signed) =>
            signed.map((tx) => ({
              signature: bs58.encode(tx.signatures[0]),
              blockhash: tx.message.recentBlockhash,
            })),
          getSignatureStatuses: async (signatures) =>
            (
              await anchorProvider.connection.getSignatureStatuses(signatures, {
                searchTransactionHistory: true,
              })
            ).value,
          isBlockhashValid: async (blockhash) =>
            (
              await (
                anchorProvider.connection as typeof anchorProvider.connection &
                  BlockhashProbe
              ).isBlockhashValid(blockhash, { commitment: 'confirmed' })
            ).value,
        },
        opts,
      )
    },
    [anchorProvider, solanaWallet, client, persist, t],
  )

  return { run, progress }
}
