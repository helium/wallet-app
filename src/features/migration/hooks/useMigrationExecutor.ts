import { TERMINAL_STATUSES } from '@hooks/useTransactionBatchStatus'
import NetInfo from '@react-native-community/netinfo'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction } from '@solana/web3.js'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import sleep from '@utils/sleep'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSolana } from '../../../solana/SolanaProvider'
import {
  BatchStatus,
  deserializeBatchTxs,
  serializeSignedBatch,
} from '../logic/batches'
import {
  ExecutorProgress,
  gateOnDeps,
  runMigration,
  RunOutcome,
} from '../logic/executor'
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

  // Set on unmount so an in-flight connectivity wait drops its NetInfo listener
  // and releases the executor closure instead of staying parked until reconnect.
  const abortedRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  useEffect(
    () => () => {
      abortedRef.current = true
      cleanupRef.current?.()
      cleanupRef.current = null
    },
    [],
  )

  const run = useCallback(
    async (input: MigrateInput): Promise<RunOutcome> => {
      if (!anchorProvider) throw new Error('Source wallet unavailable')
      if (
        solanaWallet.status !== 'connected' ||
        !solanaWallet.wallets?.length
      ) {
        throw new Error('Destination wallet unavailable')
      }

      // Clear any prior attempt's phase so a retry never flashes stale progress.
      setProgress(undefined)

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
      // event — auto-pausing the run through a network drop. Unmounting releases
      // the waiter (see cleanupRef) so the listener never leaks.
      const waitForOnline = () =>
        new Promise<void>((resolve) => {
          if (abortedRef.current) {
            resolve()
            return
          }
          NetInfo.fetch().then((state) => {
            if (abortedRef.current || state.isConnected) {
              resolve()
              return
            }
            const unsubscribe = NetInfo.addEventListener((s) => {
              if (s.isConnected) {
                unsubscribe()
                cleanupRef.current = null
                resolve()
              }
            })
            cleanupRef.current = () => {
              unsubscribe()
              resolve()
            }
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
          if (TERMINAL_STATUSES.includes(status.status)) return status
          if (Date.now() - start > POLL_TIMEOUT_MS) return status
          // eslint-disable-next-line no-await-in-loop
          await sleep(POLL_INTERVAL_MS)
        }
      }

      return runMigration<VersionedTransaction>(
        input,
        gateOnDeps(
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
          waitForOnline,
        ),
      )
    },
    [anchorProvider, solanaWallet, client, persist],
  )

  return { run, progress }
}
