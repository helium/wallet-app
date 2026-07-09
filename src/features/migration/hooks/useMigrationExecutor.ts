import NetInfo from '@react-native-community/netinfo'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useCallback, useState } from 'react'
import { useSolana } from '../../../solana/SolanaProvider'
import {
  BatchStatus,
  deserializeBatchTxs,
  serializeSignedBatch,
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

      // Resolve immediately when connected, otherwise on the next connected
      // event — auto-pausing the run through a network drop.
      const waitForOnline = () =>
        new Promise<void>((resolve) => {
          NetInfo.fetch().then((state) => {
            if (state.isConnected) {
              resolve()
              return
            }
            const unsubscribe = NetInfo.addEventListener((s) => {
              if (s.isConnected) {
                unsubscribe()
                resolve()
              }
            })
          })
        })

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

      return runMigration<VersionedTransaction>(input, {
        requestMigrate: (i) => client.migration.migrate(i),
        signBatch: (_items, data) =>
          signBatchTransactions(deserializeBatchTxs(data), {
            signWithSource,
            signWithDestination,
          }),
        submitBatch: (signed, data) =>
          client.transactions.submit(serializeSignedBatch(signed, data)),
        pollStatus,
        persist,
        onProgress: setProgress,
        waitForOnline,
      })
    },
    [anchorProvider, solanaWallet, client, persist],
  )

  return { run, progress }
}
