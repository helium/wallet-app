import { ExecutorDeps, MigrateOutput, runMigration } from '../executor'
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

type ClusterStatus = { err: unknown; confirmationStatus?: string } | null

const landed: ClusterStatus = { err: null, confirmationStatus: 'confirmed' }

// A fake cluster. Each read takes the next state and the last state repeats.
// A state holds the inputs of the server's decideTransactionStatus: the
// signature statuses (absent: never seen) and whether the blockhash is still
// in range.
const cluster = (
  ...reads: { statuses?: Record<string, ClusterStatus>; valid?: boolean }[]
) => {
  let read = 0
  const sleeps: number[] = []
  const current = () => reads[Math.min(read, reads.length - 1)]
  const deps: Partial<ExecutorDeps> = {
    sleep: async (ms) => {
      sleeps.push(ms)
    },
    isBlockhashValid: async () => current().valid ?? false,
    getSignatureStatuses: async (signatures) => {
      const { statuses = {} } = current()
      read += 1
      return signatures.map((signature) => statuses[signature] ?? null)
    },
  }
  return { deps, sleeps }
}

const serverError = (code: string, status: number) =>
  Object.assign(new Error(code), { defined: true, code, status })

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
    emptyPageMessage: 'No transactions to send',
    describeSigned: (signed) =>
      signed.map((_, i) => ({ signature: `tx${i + 1}`, blockhash: 'bh' })),
    // The cluster has not seen the page and its blockhash is still in range.
    getSignatureStatuses: async (signatures) => signatures.map(() => null),
    isBlockhashValid: async () => true,
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
    const sessions: MigrationSession[] = []
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
      persist: async (session) => {
        sessions.push(session)
      },
    })
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('partial')
    expect(outcome.confirmedSignatures).toEqual(['ok'])
    expect(outcome.failedSignatures).toEqual(['bad'])
    // Persists the failed batch's input so a retry resumes from it.
    expect(sessions[sessions.length - 1].nextInput).toEqual(input)
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
    const sessions: MigrationSession[] = []
    const { deps } = makeDeps({
      pollStatus: async () => ({
        status: 'pending',
        transactions: [
          { signature: 'done', status: 'confirmed' },
          { signature: 'wait', status: 'pending' },
        ],
      }),
      persist: async (session) => {
        sessions.push(session)
      },
    })
    const outcome = await runMigration(input, deps)
    expect(outcome.status).toBe('pending')
    expect(outcome.confirmedSignatures).toEqual(['done'])
    expect(outcome.failedSignatures).toEqual([])
    // Persists the still-pending batch's input so a check/retry resumes from
    // it rather than rebuilding from the first batch.
    expect(sessions[sessions.length - 1].nextInput).toEqual(input)
    // Session stays resumable, never marked partial/failed.
    const statuses = sessions.map((s) => s.status)
    expect(statuses).not.toContain('partial')
    expect(statuses).not.toContain('failed')
    expect(statuses[statuses.length - 1]).toBe('running')
  })

  // The server reports `partial` or `failed` once one transaction failed, even
  // with others still pending (rollupBatchStatus).
  it.each([
    [
      'partial',
      [
        { signature: 'done', status: 'confirmed' },
        { signature: 'bad', status: 'failed' },
        { signature: 'wait', status: 'pending' },
      ],
    ],
    [
      'failed',
      [
        { signature: 'bad', status: 'failed' },
        { signature: 'wait', status: 'pending' },
      ],
    ],
  ] as const)(
    'reports pending when a %s batch still has a pending transaction',
    async (status, transactions) => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        pollStatus: async () => ({ status, transactions: [...transactions] }),
        persist: async (session) => {
          sessions.push(session)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('pending')
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('running')
      expect(last.pendingBatchId).toBe('b1')
    },
  )

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

  describe('empty page', () => {
    // The migrate endpoint can return no transactions with hasMore and
    // nextParams equal to the input.
    const stuckPage = (i: MigrateInput) =>
      ({
        transactionData: txData(0),
        hasMore: true,
        nextParams: i,
      } as MigrateOutput)

    it('on page 1 with more remaining throws and signs, submits and saves nothing', async () => {
      const sessions: MigrationSession[] = []
      const requestMigrate = jest.fn(async (i: MigrateInput) => stuckPage(i))
      const { deps, log } = makeDeps({
        requestMigrate,
        persist: async (s) => {
          sessions.push(s)
        },
      })
      await expect(runMigration(input, deps)).rejects.toThrow(
        'No transactions to send',
      )
      expect(requestMigrate).toHaveBeenCalledTimes(1)
      expect(log).toEqual([])
      expect(sessions).toEqual([])
    })

    it('on a later page with more remaining fails that page without a send', async () => {
      const sessions: MigrationSession[] = []
      const requests: MigrateInput[] = []
      const { deps, log } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return requests.length === 1
            ? ({
                transactionData: txData(1),
                hasMore: true,
                nextParams: { ...input, hotspots: ['h2'] },
              } as MigrateOutput)
            : stuckPage(i)
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      expect(requests).toHaveLength(2)
      expect(log).toEqual(['sign:1', 'submit'])
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.page).toBe(2)
      expect(last.failure).toBe('No transactions to send')
      expect(last.unconfirmedSubmit).toBeUndefined()
      expect(last.nextInput?.hotspots).toEqual(['h2'])
    })

    it('on a fresh run with nothing remaining throws without a sign, a submit or a save', async () => {
      const sessions: MigrationSession[] = []
      const { deps, log } = makeDeps({
        requestMigrate: async () =>
          ({ transactionData: txData(0) } as MigrateOutput),
        persist: async (s) => {
          sessions.push(s)
        },
      })
      await expect(runMigration(input, deps)).rejects.toThrow(
        'No transactions to send',
      )
      expect(log).toEqual([])
      expect(sessions).toEqual([])
    })

    it('after a confirmed page with nothing remaining completes without a second sign', async () => {
      const sessions: MigrationSession[] = []
      let call = 0
      const { deps, log } = makeDeps({
        requestMigrate: async () => {
          call += 1
          return call === 1
            ? ({
                transactionData: txData(1),
                hasMore: true,
                nextParams: { ...input, hotspots: ['h2'] },
              } as MigrateOutput)
            : ({ transactionData: txData(0) } as MigrateOutput)
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('complete')
      expect(log).toEqual(['sign:1', 'submit'])
      expect(sessions[sessions.length - 1].status).toBe('complete')
    })
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

  it('does not retry a permanent (4xx) error — throws on first attempt', async () => {
    let calls = 0
    const { deps } = makeDeps({
      sleep: async () => {},
      requestMigrate: async () => {
        calls += 1
        // Shape mirrors an oRPC ORPCError (carries an HTTP `status`).
        throw Object.assign(
          new Error('Wallet is not in the migration allowlist'),
          {
            status: 403,
          },
        )
      },
    })
    await expect(runMigration(input, deps)).rejects.toThrow(
      'Wallet is not in the migration allowlist',
    )
    expect(calls).toBe(1)
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
    // The hasMore-branch snapshot (3rd persist, after the save before the
    // submit and the save with the batch id) must already carry the NEXT
    // batch's input — persisting before advancing would record the confirmed
    // batch 1 and make a crash-resume re-request already-confirmed work.
    expect(sessions[2].nextInput?.hotspots).toEqual(['h2'])
  })

  it('resume: polls the pending batch to terminal BEFORE re-requesting', async () => {
    const order: string[] = []
    let migrateCalls = 0
    const { deps } = makeDeps({
      pollStatus: async (batchId) => {
        order.push(`poll:${batchId}`)
        return {
          status: 'confirmed',
          transactions: [
            {
              signature: batchId === 'stale' ? 'resumed-sig' : 'sig1',
              status: 'confirmed',
            },
          ],
        }
      },
      requestMigrate: async () => {
        order.push('request')
        migrateCalls += 1
        return { transactionData: txData(1) } as MigrateOutput
      },
    })
    const outcome = await runMigration(input, deps, { pendingBatchId: 'stale' })
    expect(outcome.status).toBe('complete')
    // The stale batch is polled first, and only then is the server asked to
    // recompute remaining transfers.
    expect(order[0]).toBe('poll:stale')
    expect(order.indexOf('poll:stale')).toBeLessThan(order.indexOf('request'))
    expect(migrateCalls).toBe(1)
    // The resumed batch's confirmed signature is folded into the totals.
    expect(outcome.confirmedSignatures).toContain('resumed-sig')
  })

  it('resume: a still-pending batch is never re-requested', async () => {
    let migrateCalls = 0
    const persisted: MigrationSession[] = []
    const { deps } = makeDeps({
      pollStatus: async () => ({
        status: 'pending',
        transactions: [
          { signature: 'done', status: 'confirmed' },
          { signature: 'wait', status: 'pending' },
        ],
      }),
      requestMigrate: async () => {
        migrateCalls += 1
        return { transactionData: txData(1) } as MigrateOutput
      },
      persist: async (s) => {
        persisted.push(s)
      },
    })
    const outcome = await runMigration(input, deps, { pendingBatchId: 'stale' })
    expect(outcome.status).toBe('pending')
    // No new txs created while the prior batch is still in flight.
    expect(migrateCalls).toBe(0)
    expect(outcome.confirmedSignatures).toEqual(['done'])
    // Re-persists the batch id so a later check re-polls the same batch.
    expect(persisted[persisted.length - 1].pendingBatchId).toBe('stale')
  })

  describe('a submit with an unknown outcome', () => {
    // The server throws a plain BAD_REQUEST for any error after sending
    // started (submit.ts), so a transaction can have landed.
    const sentThenThrew = () => serverError('BAD_REQUEST', 400)

    const twoPages = (): Partial<ExecutorDeps> => {
      let call = 0
      return {
        requestMigrate: async () => {
          call += 1
          return call === 1
            ? ({
                transactionData: txData(2),
                hasMore: true,
                nextParams: { ...input, hotspots: ['h2'] },
              } as MigrateOutput)
            : ({ transactionData: txData(1) } as MigrateOutput)
        },
      }
    }

    // The first submit throws after the send; a later one returns a batch.
    const run = async (overrides: Partial<ExecutorDeps>) => {
      const sessions: MigrationSession[] = []
      const requests: MigrateInput[] = []
      let submits = 0
      const { deps } = makeDeps({
        submitBatch: async () => {
          submits += 1
          if (submits === 1) throw sentThenThrew()
          return { batchId: 'b2' }
        },
        ...overrides,
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const { requestMigrate } = deps
      deps.requestMigrate = async (i) => {
        requests.push(i)
        return requestMigrate(i)
      }
      const outcome = await runMigration(input, deps)
      return {
        outcome,
        sessions,
        requests,
        last: sessions[sessions.length - 1],
      }
    }

    it('saves the signed page and its next input before the submit', async () => {
      const atSubmit: MigrationSession[] = []
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        ...twoPages(),
        submitBatch: async () => {
          atSubmit.push(sessions[sessions.length - 1])
          return { batchId: 'b1' }
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      await runMigration(input, deps)
      expect(atSubmit[0]).toMatchObject({
        status: 'running',
        page: 1,
        nextInput: input,
        pendingTransactions: [
          { signature: 'tx1', blockhash: 'bh' },
          { signature: 'tx2', blockhash: 'bh' },
        ],
        pendingNextInput: { ...input, hotspots: ['h2'] },
      })
      expect(atSubmit[0].pendingBatchId).toBeUndefined()
      // The page stays saved with the batch id until a batch read lists its
      // transactions.
      const withBatch = sessions.find((s) => s.pendingBatchId === 'b1')
      expect(withBatch?.pendingTransactions).toEqual(
        atSubmit[0].pendingTransactions,
      )
    })

    it('reports pending and requests nothing while the blockhash is in range', async () => {
      const { deps } = cluster({ valid: true })
      const { outcome, requests, last } = await run({ ...twoPages(), ...deps })
      expect(outcome.status).toBe('pending')
      expect(requests).toHaveLength(1)
      expect(last.status).toBe('running')
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
        { signature: 'tx2', blockhash: 'bh' },
      ])
      expect(last.pendingNextInput).toEqual({ ...input, hotspots: ['h2'] })
    })

    it('counts a page that landed and moves to the next input', async () => {
      const { deps } = cluster({ statuses: { tx1: landed, tx2: landed } })
      const { outcome, requests, sessions } = await run({
        ...twoPages(),
        ...deps,
        pollStatus: async () => ({
          status: 'confirmed',
          transactions: [{ signature: 'sig-b2', status: 'confirmed' }],
        }),
      })
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['tx1', 'tx2', 'sig-b2'])
      // The landed page is never requested again.
      expect(requests).toEqual([input, { ...input, hotspots: ['h2'] }])
      const advanced = sessions.find((s) => s.page === 2)
      expect(advanced?.pendingTransactions).toBeUndefined()
      expect(advanced?.confirmedSignatures).toEqual(['tx1', 'tx2'])
    })

    it('completes when the landed page was the last one', async () => {
      const { deps } = cluster({ statuses: { tx1: landed } })
      const { outcome, requests, last } = await run(deps)
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['tx1'])
      expect(requests).toHaveLength(1)
      expect(last.status).toBe('complete')
    })

    it('fails the page as unsent when nothing landed and the blockhash stays out of range', async () => {
      const { deps, sleeps } = cluster({ valid: false })
      const { outcome, requests, last } = await run(deps)
      expect(outcome.status).toBe('failed')
      expect(outcome.failedSignatures).toEqual([])
      expect(requests).toHaveLength(1)
      // The second read comes 10 seconds after the first.
      expect(sleeps).toEqual([10000])
      expect(last.status).toBe('failed')
      expect(last.failure).toBe('BAD_REQUEST')
      expect(last.pendingTransactions).toBeUndefined()
      expect(last.unconfirmedSubmit).toBeUndefined()
    })

    it('counts a transaction that read expired once and then landed', async () => {
      // A batch can land in its last valid block: the first read can miss it.
      const { deps } = cluster(
        { valid: false },
        { valid: false, statuses: { tx1: landed } },
      )
      const { outcome } = await run(deps)
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['tx1'])
    })

    it('keeps a transaction pending when only the second read says expired', async () => {
      const blockhashes: Record<string, boolean[]> = {
        old: [false, false],
        young: [true, false],
      }
      let reads = 0
      const { outcome, last } = await run({
        sleep: async () => {},
        describeSigned: () => [
          { signature: 'tx1', blockhash: 'old' },
          { signature: 'tx2', blockhash: 'young' },
        ],
        isBlockhashValid: async (blockhash) => blockhashes[blockhash][reads],
        getSignatureStatuses: async (signatures) => {
          reads += 1
          return signatures.map(() => null)
        },
      })
      expect(outcome.status).toBe('pending')
      expect(last.pendingTransactions).toHaveLength(2)
    })

    it('reports partial when one transaction landed and the other can never land', async () => {
      const { deps } = cluster({ valid: false, statuses: { tx1: landed } })
      const { outcome, requests, last } = await run({ ...twoPages(), ...deps })
      expect(outcome.status).toBe('partial')
      expect(outcome.confirmedSignatures).toEqual(['tx1'])
      expect(outcome.failedSignatures).toEqual(['tx2'])
      expect(requests).toHaveLength(1)
      expect(last.status).toBe('partial')
      expect(last.pendingTransactions).toBeUndefined()
    })

    it('reports failed when a transaction errored on-chain', async () => {
      const { deps } = cluster({
        valid: true,
        statuses: {
          tx1: landed,
          tx2: {
            err: { InstructionError: [0, 'Custom'] },
            confirmationStatus: 'finalized',
          },
        },
      })
      const { outcome, last } = await run({ ...twoPages(), ...deps })
      expect(outcome.status).toBe('failed')
      expect(outcome.confirmedSignatures).toEqual(['tx1'])
      expect(outcome.failedSignatures).toEqual(['tx2'])
      expect(last.status).toBe('failed')
      expect(last.pendingTransactions).toBeUndefined()
    })

    it('keeps a transaction pending while the cluster has only processed it', async () => {
      const { deps } = cluster({
        valid: false,
        statuses: { tx1: { err: null, confirmationStatus: 'processed' } },
      })
      const { outcome, last } = await run(deps)
      expect(outcome.status).toBe('pending')
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
    })

    it('keeps the signed page and flags the session when the cluster cannot be read', async () => {
      const { outcome, requests, last } = await run({
        sleep: async () => {},
        getSignatureStatuses: async () => {
          throw new Error('rpc down')
        },
      })
      expect(outcome.status).toBe('failed')
      expect(requests).toHaveLength(1)
      expect(last.status).toBe('failed')
      expect(last.unconfirmedSubmit).toBe(true)
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
      expect(last.pendingNextInput).toBeNull()
    })

    it('does not read the cluster after a definite rejection and drops the signed page', async () => {
      const getSignatureStatuses = jest.fn(async () => [])
      const { outcome, last } = await run({
        getSignatureStatuses,
        submitBatch: async () => {
          throw serverError('SIMULATION_FAILED', 400)
        },
      })
      expect(outcome.status).toBe('failed')
      expect(getSignatureStatuses).not.toHaveBeenCalled()
      expect(last.status).toBe('failed')
      expect(last.page).toBe(1)
      expect(last.failure).toBe('SIMULATION_FAILED')
      expect(last.pendingTransactions).toBeUndefined()
      expect(last.unconfirmedSubmit).toBeUndefined()
    })

    it('keeps the signed page with a batch id that records none of its transactions', async () => {
      const sessions: MigrationSession[] = []
      let submits = 0
      const { deps } = makeDeps({
        sleep: async () => {},
        submitBatch: async () => {
          submits += 1
          if (submits === 1) {
            throw Object.assign(new Error('server error'), { status: 500 })
          }
          return { batchId: 'X' }
        },
        pollStatus: async () => ({ status: 'pending', transactions: [] }),
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('pending')
      const last = sessions[sessions.length - 1]
      expect(last.pendingBatchId).toBe('X')
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
    })

    it('reports pending when the batch reads expired with none of the page transactions', async () => {
      const sessions: MigrationSession[] = []
      const requestMigrate = jest.fn(
        async () => ({ transactionData: txData(1) } as MigrateOutput),
      )
      const { deps } = makeDeps({
        requestMigrate,
        pollStatus: async () => ({ status: 'expired', transactions: [] }),
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('pending')
      expect(requestMigrate).toHaveBeenCalledTimes(1)
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('running')
      expect(last.pendingBatchId).toBe('b1')
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
    })

    it('reads the cluster when a rejection follows an attempt that may have landed', async () => {
      // The first attempt landed but its response was lost; the resend then
      // fails simulation because the transaction is already processed.
      let submits = 0
      const { deps } = cluster({ statuses: { tx1: landed } })
      const { outcome } = await run({
        ...deps,
        submitBatch: async () => {
          submits += 1
          if (submits === 1) throw new Error('network down')
          throw serverError('SIMULATION_FAILED', 400)
        },
      })
      expect(submits).toBe(2)
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['tx1'])
    })
  })

  describe('a resume with a saved signed page', () => {
    const page = (n: number): MigrateInput => ({
      ...input,
      hotspots: [`h${n}`],
    })
    const saved = [{ signature: 'tx1', blockhash: 'bh' }]

    // Resumes page 2, whose signed page was saved with no batch id.
    const resume = async (
      overrides: Partial<ExecutorDeps>,
      pendingNextInput: MigrateInput | null,
    ) => {
      const sessions: MigrationSession[] = []
      const requests: MigrateInput[] = []
      const { deps, log } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        ...overrides,
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(page(2), deps, {
        pendingTransactions: saved,
        pendingNextInput,
        startPage: 2,
        priorConfirmedSignatures: ['sig1'],
      })
      return { outcome, sessions, requests, log }
    }

    it('requests and signs nothing while the saved page can still land', async () => {
      const { deps } = cluster({ valid: true })
      const { outcome, sessions, requests, log } = await resume(deps, page(3))
      expect(outcome.status).toBe('pending')
      expect(requests).toEqual([])
      expect(log).toEqual([])
      expect(sessions).toHaveLength(1)
      expect(sessions[0]).toMatchObject({
        status: 'running',
        page: 2,
        nextInput: page(2),
        pendingTransactions: saved,
        pendingNextInput: page(3),
      })
    })

    it('counts a saved page that landed and requests the saved next input', async () => {
      const { deps } = cluster({ statuses: { tx1: landed } })
      const { outcome, sessions, requests } = await resume(
        {
          ...deps,
          pollStatus: async () => ({
            status: 'confirmed',
            transactions: [{ signature: 'sig3', status: 'confirmed' }],
          }),
        },
        page(3),
      )
      expect(requests).toEqual([page(3)])
      expect(sessions[0]).toMatchObject({
        status: 'running',
        page: 3,
        nextInput: page(3),
        confirmedSignatures: ['sig1', 'tx1'],
      })
      expect(sessions[0].pendingTransactions).toBeUndefined()
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['sig1', 'tx1', 'sig3'])
    })

    it('completes without a request when the saved page landed and was the last one', async () => {
      const { deps } = cluster({ statuses: { tx1: landed } })
      const { outcome, sessions, requests } = await resume(deps, null)
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['sig1', 'tx1'])
      expect(requests).toEqual([])
      expect(sessions[sessions.length - 1].status).toBe('complete')
    })

    it('requests the same page again when the saved page can never land', async () => {
      const { deps, sleeps } = cluster({ valid: false })
      const { outcome, sessions, requests } = await resume(deps, page(3))
      // The second read comes 10 seconds after the first.
      expect(sleeps).toEqual([10000])
      expect(requests).toEqual([page(2)])
      expect(sessions.every((s) => s.page === 2)).toBe(true)
      expect(outcome.status).toBe('complete')
      expect(outcome.failedSignatures).toEqual([])
    })

    it('requests the saved input when the saved page landed but has no saved next input', async () => {
      const { deps } = cluster({ statuses: { tx1: landed } })
      const requestMigrate = jest.fn(
        async () => ({ transactionData: txData(1) } as MigrateOutput),
      )
      const outcome = await runMigration(
        page(2),
        makeDeps({ ...deps, requestMigrate }).deps,
        {
          pendingTransactions: saved,
          startPage: 2,
          priorConfirmedSignatures: ['sig1'],
        },
      )
      expect(requestMigrate).toHaveBeenCalledWith(page(2))
      expect(outcome.status).toBe('complete')
    })

    // A batch id whose batch lists none of the saved page's transactions.
    const resumeEmptyBatch = async (overrides: Partial<ExecutorDeps>) => {
      const requestMigrate = jest.fn(
        async () => ({ transactionData: txData(1) } as MigrateOutput),
      )
      const { deps } = makeDeps({
        requestMigrate,
        pollStatus: async () => ({ status: 'expired', transactions: [] }),
        ...overrides,
      })
      const outcome = await runMigration(input, deps, {
        pendingBatchId: 'X',
        pendingTransactions: saved,
        pendingNextInput: null,
      })
      return { outcome, requestMigrate }
    }

    it('completes without a request when a batch with no rows lists a saved page that landed', async () => {
      const { deps } = cluster({ statuses: { tx1: landed } })
      const { outcome, requestMigrate } = await resumeEmptyBatch(deps)
      expect(outcome.status).toBe('complete')
      expect(requestMigrate).not.toHaveBeenCalled()
    })

    it('requests the saved input once when a batch with no rows holds a saved page that never landed', async () => {
      const { deps } = cluster({ valid: false })
      const { requestMigrate } = await resumeEmptyBatch(deps)
      expect(requestMigrate).toHaveBeenCalledTimes(1)
      expect(requestMigrate).toHaveBeenCalledWith(input)
    })
  })

  it('retries a transient pollStatus failure then succeeds', async () => {
    let calls = 0
    const { deps } = makeDeps({
      sleep: async () => {},
      pollStatus: async () => {
        calls += 1
        if (calls === 1) throw new Error('poll flaky')
        return {
          status: 'confirmed',
          transactions: [{ signature: 'sig1', status: 'confirmed' }],
        }
      },
    })
    const outcome = await runMigration(input, deps)
    expect(calls).toBe(2)
    expect(outcome.status).toBe('complete')
    expect(outcome.confirmedSignatures).toEqual(['sig1'])
  })

  describe('error mid-loop', () => {
    const jitoError = () =>
      Object.assign(
        new Error(
          'Unable to fit Jito tip instruction into the transaction bundle',
        ),
        { status: 400 },
      )
    const page = (n: number): MigrateInput => ({
      ...input,
      hotspots: [`h${n}`],
    })

    // Pages 1 and 2 confirm; page 3 fails with the given error.
    const failOnPage3 = (error: () => Error) => {
      const requests: MigrateInput[] = []
      const sessions: MigrationSession[] = []
      let signature = 0
      const { deps } = makeDeps({
        sleep: async () => {},
        requestMigrate: async (i) => {
          requests.push(i)
          if (requests.length === 3) throw error()
          return {
            transactionData: txData(1),
            hasMore: true,
            nextParams: page(requests.length + 1),
          } as MigrateOutput
        },
        pollStatus: async () => {
          signature += 1
          return {
            status: 'confirmed',
            transactions: [
              { signature: `sig${signature}`, status: 'confirmed' },
            ],
          }
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      return { deps, requests, sessions }
    }

    it('a 4xx on page 3 is not retried and saves nextParams with the failed page', async () => {
      const { deps, requests, sessions } = failOnPage3(jitoError)
      const outcome = await runMigration(input, deps)
      expect(requests).toHaveLength(3)
      expect(outcome.status).toBe('failed')
      expect(outcome.confirmedSignatures).toEqual(['sig1', 'sig2'])
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.nextInput).toEqual(page(3))
      expect(last.originalInput).toEqual(input)
      expect(last.page).toBe(3)
      expect(last.failure).toBe(
        'Unable to fit Jito tip instruction into the transaction bundle',
      )
      expect(last.confirmedSignatures).toEqual(['sig1', 'sig2'])
      expect(last.pendingBatchId).toBeUndefined()
    })

    it('a resumed run starts at the saved page and keeps prior confirmed signatures', async () => {
      const requests: MigrateInput[] = []
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          throw jitoError()
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps, {
        startPage: 3,
        priorConfirmedSignatures: ['sig1', 'sig2'],
      })
      // The resume replays only the saved page, never the original selection.
      // A resumed run is called with the saved nextInput as its input.
      expect(requests).toEqual([input])
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.page).toBe(3)
      expect(last.confirmedSignatures).toEqual(['sig1', 'sig2'])
    })

    it('a resumed run continues from the saved page through completion', async () => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        pollStatus: async () => ({
          status: 'confirmed',
          transactions: [{ signature: 'sig3', status: 'confirmed' }],
        }),
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(page(3), deps, {
        startPage: 3,
        priorConfirmedSignatures: ['sig1', 'sig2'],
      })
      expect(outcome.status).toBe('complete')
      expect(outcome.confirmedSignatures).toEqual(['sig1', 'sig2', 'sig3'])
      expect(sessions.every((s) => s.page === 3)).toBe(true)
      expect(sessions[sessions.length - 1].failure).toBeUndefined()
    })

    it('a page-1 error with nothing submitted throws and persists nothing', async () => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        requestMigrate: async () => {
          throw jitoError()
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      await expect(runMigration(input, deps)).rejects.toThrow(
        'Unable to fit Jito tip instruction',
      )
      expect(sessions).toEqual([])
    })

    it.each([
      [
        'a 5xx',
        () => Object.assign(new Error('server error'), { status: 503 }),
      ],
      ['a status-less', () => new Error('network down')],
    ])(
      'a page-1 submit error from %s error is retried, then keeps the signed page and reports pending',
      async (_label, error) => {
        const sessions: MigrationSession[] = []
        let submits = 0
        const { deps } = makeDeps({
          sleep: async () => {},
          submitBatch: async () => {
            submits += 1
            throw error()
          },
          persist: async (s) => {
            sessions.push(s)
          },
        })
        const outcome = await runMigration(input, deps)
        expect(submits).toBe(3)
        // The cluster has not seen the page and its blockhash is in range, so
        // the page can still land.
        expect(outcome.status).toBe('pending')
        const last = sessions[sessions.length - 1]
        expect(last.status).toBe('running')
        expect(last.page).toBe(1)
        expect(last.pendingTransactions).toEqual([
          { signature: 'tx1', blockhash: 'bh' },
        ])
        expect(last.failure).toBeUndefined()
        expect(last.unconfirmedSubmit).toBeUndefined()
      },
    )

    it('a page-1 submit 5xx with an unreadable cluster resolves failed even when persisting the failed snapshot rejects', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const { deps } = makeDeps({
        sleep: async () => {},
        submitBatch: async () => {
          throw Object.assign(new Error('server error'), { status: 503 })
        },
        getSignatureStatuses: async () => {
          throw new Error('rpc down')
        },
        persist: async (s) => {
          if (s.status === 'failed') throw new Error('disk full')
        },
      })
      await expect(runMigration(input, deps)).resolves.toMatchObject({
        status: 'failed',
      })
      warn.mockRestore()
    })

    it.each([
      [
        'a requestMigrate',
        {
          requestMigrate: async () => {
            throw jitoError()
          },
        },
      ],
      [
        'a sign',
        {
          signBatch: async () => {
            throw new Error('User rejected')
          },
        },
      ],
    ])(
      'a page-1 %s error throws and persists nothing',
      async (_label, overrides: Partial<ExecutorDeps>) => {
        const sessions: MigrationSession[] = []
        const { deps } = makeDeps({
          sleep: async () => {},
          ...overrides,
          persist: async (s) => {
            sessions.push(s)
          },
        })
        await expect(runMigration(input, deps)).rejects.toThrow()
        expect(sessions).toEqual([])
      },
    )

    it('a page-1 submit whose later attempt is a definite rejection keeps the signed page when an earlier attempt was ambiguous', async () => {
      const sessions: MigrationSession[] = []
      let submits = 0
      const { deps } = makeDeps({
        sleep: async () => {},
        submitBatch: async () => {
          submits += 1
          if (submits === 1) throw new Error('network down')
          throw serverError('BLOCKHASH_EXPIRED', 400)
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(submits).toBe(2)
      expect(outcome.status).toBe('pending')
      expect(sessions[sessions.length - 1].pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
    })

    // Page 1 confirms; page 2's submit throws the given error.
    const failSubmitOnPage2 = (
      error: () => Error,
      persist?: (s: MigrationSession, submits: number) => Promise<void>,
    ) => {
      const sessions: MigrationSession[] = []
      let submits = 0
      const { deps } = makeDeps({
        sleep: async () => {},
        requestMigrate: async () =>
          ({
            transactionData: txData(1),
            hasMore: true,
            nextParams: page(2),
          } as MigrateOutput),
        submitBatch: async () => {
          submits += 1
          if (submits === 1) return { batchId: 'b1' }
          throw error()
        },
        persist: async (s) => {
          sessions.push(s)
          if (persist) await persist(s, submits)
        },
      })
      return { deps, sessions }
    }

    it('a page-2 submit that fails with a 503 on every attempt keeps the signed page and reports pending', async () => {
      const { deps, sessions } = failSubmitOnPage2(() =>
        Object.assign(new Error('server error'), { status: 503 }),
      )
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('pending')
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('running')
      expect(last.page).toBe(2)
      expect(last.nextInput).toEqual(page(2))
      expect(last.pendingTransactions).toEqual([
        { signature: 'tx1', blockhash: 'bh' },
      ])
      expect(last.pendingBatchId).toBeUndefined()
    })

    it('a page-2 submit with a definite rejection on its first attempt drops the signed page and is not flagged unconfirmed', async () => {
      const { deps, sessions } = failSubmitOnPage2(() =>
        serverError('SIMULATION_FAILED', 400),
      )
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.page).toBe(2)
      expect(last.pendingTransactions).toBeUndefined()
      expect(last.unconfirmedSubmit).toBeUndefined()
    })

    it('a page-2 submit failure resolves failed even when every persist after page 1 rejects', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const { deps } = failSubmitOnPage2(
        () => Object.assign(new Error('server error'), { status: 503 }),
        async (_s, submits) => {
          if (submits > 1) throw new Error('disk full')
        },
      )
      await expect(runMigration(input, deps)).resolves.toMatchObject({
        status: 'failed',
      })
      warn.mockRestore()
    })

    it('a failed save of the signed page 2 before its submit drops the page', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      let thrown = false
      const { deps, sessions } = failSubmitOnPage2(
        () => new Error('unused'),
        async (s) => {
          if (
            !thrown &&
            s.status === 'running' &&
            s.page === 2 &&
            s.pendingTransactions
          ) {
            thrown = true
            throw new Error('disk full')
          }
        },
      )
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      expect(thrown).toBe(true)
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.page).toBe(2)
      expect(last.nextInput).toEqual(page(2))
      expect(last.pendingTransactions).toBeUndefined()
      expect(last.unconfirmedSubmit).toBeUndefined()
      warn.mockRestore()
    })

    it('a sign error on page 3 saves nextParams for the retry', async () => {
      const sessions: MigrationSession[] = []
      let call = 0
      const { deps } = makeDeps({
        requestMigrate: async () => {
          call += 1
          return {
            transactionData: txData(1),
            hasMore: true,
            nextParams: page(call + 1),
          } as MigrateOutput
        },
        signBatch: async (data) => {
          if (call === 3) throw new Error('User rejected')
          return data.transactions
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.nextInput).toEqual(page(3))
      expect(last.page).toBe(3)
      expect(last.failure).toBe('User rejected')
    })

    it('a poll error after submit keeps the in-flight batch id for the resume guard', async () => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        sleep: async () => {},
        pollStatus: async () => {
          throw new Error('poll down')
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.pendingBatchId).toBe('b1')
      expect(last.nextInput).toEqual(input)
      expect(last.pendingNextInput).toBeNull()
      expect(last.page).toBe(1)
    })

    it('a poll error on a last page saves a null pendingNextInput even with nextParams', async () => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        sleep: async () => {},
        requestMigrate: async () =>
          ({
            transactionData: txData(1),
            hasMore: false,
            nextParams: { ...input, hotspots: ['h2'] },
          } as MigrateOutput),
        pollStatus: async () => {
          throw new Error('poll down')
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(input, deps)
      expect(outcome.status).toBe('failed')
      expect(sessions[sessions.length - 1].pendingNextInput).toBeNull()
    })

    it('a persist error after a page confirms saves the next page without the settled batch id', async () => {
      const sessions: MigrationSession[] = []
      let call = 0
      const { deps } = makeDeps({
        requestMigrate: async () => {
          call += 1
          return {
            transactionData: txData(1),
            hasMore: true,
            nextParams: page(call + 1),
          } as MigrateOutput
        },
        persist: async (s) => {
          sessions.push(s)
          if (s.status === 'running' && !s.pendingBatchId && s.page === 2) {
            throw new Error('disk full')
          }
        },
      })
      const outcome = await runMigration(page(1), deps)
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.status).toBe('failed')
      expect(last.page).toBe(2)
      expect(last.pendingBatchId).toBeUndefined()
      expect(last.nextInput).toEqual(page(2))
    })

    // Page 1 confirms; page 2 submits and its poll throws.
    const pollFailsOnPage2 = () => {
      const sessions: MigrationSession[] = []
      let polls = 0
      const { deps } = makeDeps({
        sleep: async () => {},
        requestMigrate: async (i) =>
          ({
            transactionData: txData(1),
            hasMore: true,
            nextParams: page(Number(i.hotspots?.[0]?.slice(1) ?? 1) + 1),
          } as MigrateOutput),
        pollStatus: async () => {
          polls += 1
          if (polls > 1) throw new Error('poll down')
          return {
            status: 'confirmed',
            transactions: [{ signature: 'sig1', status: 'confirmed' }],
          }
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      return { deps, sessions }
    }

    it('a poll error after submit saves the input that follows the in-flight batch', async () => {
      const { deps, sessions } = pollFailsOnPage2()
      const outcome = await runMigration(page(1), deps)
      expect(outcome.status).toBe('failed')
      const last = sessions[sessions.length - 1]
      expect(last.pendingBatchId).toBe('b1')
      expect(last.nextInput).toEqual(page(2))
      expect(last.pendingNextInput).toEqual(page(3))
      expect(last.page).toBe(2)
    })

    it('a resume whose in-flight batch confirmed requests the saved next input', async () => {
      const { deps: firstDeps, sessions: saved } = pollFailsOnPage2()
      await runMigration(page(1), firstDeps)
      const session = saved[saved.length - 1]

      const requests: MigrateInput[] = []
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        pollStatus: async (batchId) => ({
          status: 'confirmed',
          transactions: [
            {
              signature: batchId === 'b1' ? 'sig2' : 'sig3',
              status: 'confirmed',
            },
          ],
        }),
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(session.nextInput ?? input, deps, {
        pendingBatchId: session.pendingBatchId,
        pendingNextInput: session.pendingNextInput,
        startPage: session.page,
        priorConfirmedSignatures: session.confirmedSignatures,
      })
      expect(requests[0]).toEqual(page(3))
      expect(sessions[0].page).toBe(3)
      expect(sessions[0].nextInput).toEqual(page(3))
      expect(outcome.status).toBe('complete')
    })

    it('a resume whose in-flight batch was the last page completes without a request', async () => {
      const requestMigrate = jest.fn(
        async () => ({ transactionData: txData(1) } as MigrateOutput),
      )
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        requestMigrate,
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        pendingNextInput: null,
        startPage: 2,
      })
      expect(outcome.status).toBe('complete')
      expect(requestMigrate).not.toHaveBeenCalled()
      expect(sessions[sessions.length - 1].status).toBe('complete')
    })

    it('a resume whose in-flight batch has failed signatures re-requests its page', async () => {
      const requests: MigrateInput[] = []
      let polls = 0
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        pollStatus: async () => {
          polls += 1
          return polls === 1
            ? {
                status: 'partial',
                transactions: [
                  { signature: 'ok', status: 'confirmed' },
                  { signature: 'bad', status: 'failed' },
                ],
              }
            : {
                status: 'confirmed',
                transactions: [{ signature: 'sig3', status: 'confirmed' }],
              }
        },
      })
      await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        pendingNextInput: page(3),
        startPage: 2,
      })
      expect(requests[0]).toEqual(page(2))
    })

    it('a resume whose in-flight batch failed without failed signatures re-requests its page', async () => {
      const requests: MigrateInput[] = []
      let polls = 0
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        pollStatus: async () => {
          polls += 1
          return polls === 1
            ? { status: 'failed', transactions: [] }
            : {
                status: 'confirmed',
                transactions: [{ signature: 'sig3', status: 'confirmed' }],
              }
        },
      })
      await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        pendingNextInput: page(3),
        startPage: 2,
      })
      expect(requests[0]).toEqual(page(2))
    })

    it('a resume whose confirmed in-flight batch has a failed signature re-requests its page', async () => {
      const requests: MigrateInput[] = []
      let polls = 0
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        pollStatus: async () => {
          polls += 1
          return polls === 1
            ? {
                status: 'confirmed',
                transactions: [
                  { signature: 'ok', status: 'confirmed' },
                  { signature: 'bad', status: 'failed' },
                ],
              }
            : {
                status: 'confirmed',
                transactions: [{ signature: 'sig3', status: 'confirmed' }],
              }
        },
      })
      await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        pendingNextInput: page(3),
        startPage: 2,
      })
      expect(requests[0]).toEqual(page(2))
    })

    it('a resume that skips a confirmed in-flight batch clears the pending fields', async () => {
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        persist: async (s) => {
          sessions.push(s)
        },
      })
      await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        pendingNextInput: page(3),
        startPage: 2,
      })
      const advanced = sessions[0]
      expect(advanced.status).toBe('running')
      expect(advanced.nextInput).toEqual(page(3))
      expect(advanced.pendingBatchId).toBeUndefined()
      expect(advanced.pendingNextInput).toBeUndefined()
    })

    it('a legacy resume without pendingNextInput re-requests its page', async () => {
      const requests: MigrateInput[] = []
      const sessions: MigrationSession[] = []
      const { deps } = makeDeps({
        requestMigrate: async (i) => {
          requests.push(i)
          return { transactionData: txData(1) } as MigrateOutput
        },
        persist: async (s) => {
          sessions.push(s)
        },
      })
      const outcome = await runMigration(page(2), deps, {
        pendingBatchId: 'stale',
        startPage: 2,
      })
      expect(requests).toEqual([page(2)])
      expect(sessions.every((s) => s.page === 2)).toBe(true)
      expect(outcome.status).toBe('complete')
    })

    it('does not count a re-polled batch twice when seeded with prior signatures', async () => {
      const { deps } = makeDeps({
        pollStatus: async () => ({
          status: 'confirmed',
          transactions: [{ signature: 'sig1', status: 'confirmed' }],
        }),
      })
      const outcome = await runMigration(input, deps, {
        pendingBatchId: 'stale',
        priorConfirmedSignatures: ['sig1'],
      })
      expect(outcome.confirmedSignatures).toEqual(['sig1'])
    })
  })
})
