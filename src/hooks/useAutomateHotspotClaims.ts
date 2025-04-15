import {
  cronJobKey,
  cronJobNameMappingKey,
  cronJobTransactionKey,
  init as initCron,
} from '@helium/cron-sdk'
import {
  entityCronAuthorityKey,
  init as initHplCrons,
} from '@helium/hpl-crons-sdk'
import { sendInstructionsWithPriorityFee } from '@helium/spl-utils'
import {
  init as initTuktuk,
  taskKey,
  nextAvailableTaskIds,
} from '@helium/tuktuk-sdk'
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js'
import { useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'
import { useCronJob } from './useCronJob'

type Schedule = 'daily' | 'weekly' | 'monthly'

const TASK_QUEUE = new PublicKey('H39gEszvsi6AT4rYBiJTuZHJSF5hMHy6CKGTd7wzhsg7')
const FUNDING_AMOUNT = 10000000 // 0.01 SOL in lamports

const getScheduleCronString = (schedule: Schedule) => {
  switch (schedule) {
    case 'daily':
      return '0 0 0 * * *'
    case 'weekly':
      return '0 0 0 * * 0'
    case 'monthly':
      return '0 0 0 1 * *'
    default:
      return '0 0 0 * * *'
  }
};

export const useAutomateHotspotClaims = (
  schedule: Schedule,
  duration: number,
) => {
  const { anchorProvider: provider } = useSolana()

  const authority = useMemo(() => {
    if (!provider?.wallet.publicKey) return undefined
    return entityCronAuthorityKey(provider.wallet.publicKey)[0]
  }, [provider?.wallet.publicKey])

  const cronJob = useMemo(() => {
    if (!authority) return undefined;
    return cronJobKey(authority, 0)[0]
  }, [authority])

  const { info: cronJobAccount } = useCronJob(cronJob)

  const { loading, error, execute } = useAsyncCallback(
    async (params: {
      onInstructions?: (instructions: TransactionInstruction[]) => Promise<void>
    }) => {
      if (!provider || !authority || !cronJob) {
        throw new Error('Missing required parameters')
      }
      const hplCronsProgram = await initHplCrons(provider)
      const tuktukProgram = await initTuktuk(provider)

      const taskQueueAcc = await tuktukProgram.account.taskQueueV0.fetch(
        TASK_QUEUE,
      )
      const nextAvailable = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1)[0]
      const [task] = taskKey(TASK_QUEUE, nextAvailable)

      const instructions: TransactionInstruction[] = []

      // If cronJob doesn't exist, create it
      if (!cronJobAccount) {
        instructions.push(
          await hplCronsProgram.methods
            .initEntityClaimCronV0({
              schedule: getScheduleCronString(schedule),
            })
            .accountsPartial({
              taskQueue: TASK_QUEUE,
              cronJob,
              task,
              cronJobNameMapping: cronJobNameMappingKey(
                authority,
                'entity_claim',
              )[0],
            })
            .instruction(),
          SystemProgram.transfer({
            fromPubkey: provider.wallet.publicKey,
            toPubkey: cronJob,
            lamports: FUNDING_AMOUNT,
          }),
        );
      }

      // Add the entity to the cron job
      const { instruction } = await hplCronsProgram.methods
        .addWalletToEntityCronV0({
          index: cronJobAccount?.nextTransactionId || 0,
        })
        .accountsPartial({
          cronJob,
          cronJobTransaction: cronJobTransactionKey(
            cronJob,
            cronJobAccount?.nextTransactionId || 0,
          )[0],
        })
        .prepare()

      instructions.push(instruction)

      if (params.onInstructions) {
        await params.onInstructions(instructions)
      } else {
        await sendInstructionsWithPriorityFee(provider, instructions, {
          computeUnitLimit: 500000,
        })
      }
    },
  );

  const { execute: remove, loading: removing, error: removeError } = useAsyncCallback(
    async (params: {
      onInstructions?: (instructions: any) => Promise<void>
    }) => {
      if (!provider || !cronJob) {
        throw new Error('Missing required parameters')
      }
      const hplCronsProgram = await initHplCrons(provider)

      const instructions = [
        await hplCronsProgram.methods
          .closeCronJobV0()
          .accounts({
            cronJob,
          })
          .instruction(),
      ];

      if (params.onInstructions) {
        await params.onInstructions(instructions)
      } else {
        await sendInstructionsWithPriorityFee(provider, instructions, {
          computeUnitLimit: 500000,
        })
      }
    },
  )

  return {
    loading: loading || removing,
    error: error || removeError,
    execute,
    remove,
    hasExistingAutomation: !!cronJobAccount,
  }
}
