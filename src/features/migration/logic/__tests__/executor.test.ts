import {
  ExecutorDeps,
  gateOnDeps,
  MigrateOutput,
  runMigration,
} from '../executor'
import { MigrateInput, MigrationSession } from '../session'

const input: MigrateInput = {
  sourceWallet: 'src',
  destinationWallet: 'dst',
  hotspots: ['h1'],
  tokens: [],
}

const txData = (n: number) => ({
  transactions: Array.from({ length: n }, () => ({
    serializedTransaction: 'AA==',
    metadata: {},
  })),
  parallel: false,
})

const makeDeps = (
  overrides: Partial<ExecutorDeps> = {},
): { deps: ExecutorDeps; log: string[] } => {
  const log: string[] = []
  const deps: ExecutorDeps = {
    requestMigrate: async () =>
      ({ transactionData: txData(1) } as MigrateOutput),
    signBatch: async (data) => {
      log.push(`sign:${data.transactions.length}`)
      return data.transactions
    },
    submitBatch: async () => {
      log.push('submit')
      return { batchId: 'b1' }
    },
    pollStatus: async () => ({
      status: 'confirmed',
      transactions: [{ signature: 'sig1', status: 'confirmed' }],
    }),
    persist: async () => {
      log.push('persist')
    },
    onProgress: () => {},
    ...overrides,
  }
  return { deps, log }
}

describe('runMigration', () => {
  it('completes a single confirmed batch', async () => {
    const { deps, log } = makeDeps()
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('complete')
    expect(outcome.confirmedSignatures).toEqual(['sig1'])
    expect(log).toContain('persist')
  })

  it('paginates through hasMore/nextParams', async () => {
    const requests: MigrateInput[] = []
    let call = 0
    const { deps } = makeDeps({
      requestMigrate: async (i) => {
        requests.push(i)
        call += 1
        return call === 1
          ? ({
              transactionData: txData(1),
              hasMore: true,
              nextParams: { ...input, hotspots: ['h2'] },
            } as MigrateOutput)
          : ({ transactionData: txData(1) } as MigrateOutput)
      },
      pollStatus: async () => ({
        status: 'confirmed',
        transactions: [{ signature: 's', status: 'confirmed' }],
      }),
    })
    const outcome = await runMigration(input, deps)
    expect(requests).toHaveLength(2)
    expect(requests[1].hotspots).toEqual(['h2'])
    expect(outcome.status).toBe('complete')
  })

  it('stops and reports partial when a batch has failed txs', async () => {
    const { deps } = makeDeps({
      requestMigrate: async () =>
        ({
          transactionData: txData(2),
          hasMore: true,
          nextParams: input,
        } as MigrateOutput),
      pollStatus: async () => ({
        status: 'partial',
        transactions: [
          { signature: 'ok', status: 'confirmed' },
          { signature: 'bad', status: 'failed' },
        ],
      }),
    })
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('partial')
    expect(outcome.confirmedSignatures).toEqual(['ok'])
    expect(outcome.failedSignatures).toEqual(['bad'])
    // Carries the failed batch's input so a same-session retry resumes from it.
    expect(outcome.nextInput).toEqual(input)
  })

  it('stops and reports failed on a failed/expired batch', async () => {
    const { deps } = makeDeps({
      pollStatus: async () => ({
        status: 'expired',
        transactions: [{ signature: 'x', status: 'expired' }],
      }),
    })
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('failed')
    expect(outcome.confirmedSignatures).toEqual([])
    expect(outcome.failedSignatures).toEqual(['x'])
  })

  it('reports pending (not partial) when a batch is still confirming', async () => {
    const persisted: string[] = []
    const { deps } = makeDeps({
      pollStatus: async () => ({
        status: 'pending',
        transactions: [
          { signature: 'done', status: 'confirmed' },
          { signature: 'wait', status: 'pending' },
        ],
      }),
      persist: async (session) => {
        persisted.push(session.status)
      },
    })
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('pending')
    expect(outcome.confirmedSignatures).toEqual(['done'])
    expect(outcome.failedSignatures).toEqual([])
    expect(outcome.pendingSignatures).toEqual(['wait'])
    // Carries the still-pending batch's input so a same-session check/retry
    // resumes from it rather than rebuilding from the first batch.
    expect(outcome.nextInput).toEqual(input)
    // Session stays resumable, never marked partial/failed.
    expect(persisted).not.toContain('partial')
    expect(persisted).not.toContain('failed')
    expect(persisted[persisted.length - 1]).toBe('running')
  })

  it('persists a resumable snapshot before the first batch confirms', async () => {
    const statusesAtConfirm: string[] = []
    let confirmed = false
    const { deps } = makeDeps({
      persist: async (session) => {
        // Capture snapshots written before pollStatus resolves.
        if (!confirmed) statusesAtConfirm.push(session.status)
      },
      pollStatus: async () => {
        confirmed = true
        return {
          status: 'confirmed',
          transactions: [{ signature: 'sig1', status: 'confirmed' }],
        }
      },
    })
    await runMigration(input, deps)
    expect(statusesAtConfirm).toContain('running')
  })

  it('persists a snapshot after each batch with accumulated signatures', async () => {
    const snapshots: string[][] = []
    const { deps } = makeDeps({
      persist: async (session) => {
        snapshots.push(session.confirmedSignatures)
      },
    })
    await runMigration(input, deps)
    expect(snapshots[snapshots.length - 1]).toEqual(['sig1'])
  })

  it('retries a transient requestMigrate failure then succeeds', async () => {
    let calls = 0
    const { deps } = makeDeps({
      sleep: async () => {},
      requestMigrate: async () => {
        calls += 1
        if (calls === 1) throw new Error('rpc flaky')
        return { transactionData: txData(1) } as MigrateOutput
      },
    })
    const outcome = await runMigration(input, deps)
    expect(calls).toBe(2)
    expect(outcome.status).toBe('complete')
  })

  it('propagates the error when retries are exhausted', async () => {
    let calls = 0
    const { deps } = makeDeps({
      sleep: async () => {},
      requestMigrate: async () => {
        calls += 1
        throw new Error('rpc down')
      },
    })
    await expect(runMigration(input, deps)).rejects.toThrow('rpc down')
    expect(calls).toBe(3)
  })

  it('gates every network dep on connectivity via gateOnDeps', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((r) => {
      release = r
    })
    const order: string[] = []
    const { deps } = makeDeps({
      requestMigrate: async () => {
        order.push('request')
        return { transactionData: txData(1) } as MigrateOutput
      },
      submitBatch: async () => {
        order.push('submit')
        return { batchId: 'b1' }
      },
      pollStatus: async () => {
        order.push('poll')
        return {
          status: 'confirmed',
          transactions: [{ signature: 'sig1', status: 'confirmed' }],
        }
      },
    })
    const gated = gateOnDeps(deps, () => gate)
    const p = runMigration(input, gated)
    // Every network-facing dep is parked on the gate — nothing runs yet.
    await Promise.resolve()
    expect(order).toEqual([])
    release()
    const outcome = await p
    expect(order).toEqual(['request', 'submit', 'poll'])
    expect(outcome.status).toBe('complete')
  })

  it('persists the current batch input as nextInput for resume', async () => {
    const sessions: MigrationSession[] = []
    let call = 0
    const { deps } = makeDeps({
      requestMigrate: async () => {
        call += 1
        return call === 1
          ? ({
              transactionData: txData(1),
              hasMore: true,
              nextParams: { ...input, hotspots: ['h2'] },
            } as MigrateOutput)
          : ({ transactionData: txData(1) } as MigrateOutput)
      },
      persist: async (session) => {
        sessions.push(session)
      },
    })
    await runMigration(input, deps)
    // The snapshot written while on batch 2 carries the batch-2 input so a
    // resume never re-sends the confirmed first batch.
    const last = sessions[sessions.length - 1]
    expect(last.nextInput?.hotspots).toEqual(['h2'])
    expect(last.batch).toBe(2)
  })
})
