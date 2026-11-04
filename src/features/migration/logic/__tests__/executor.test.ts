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
    // The hasMore-branch snapshot (2nd persist) must already carry the NEXT
    // batch's input — persisting before advancing would record the confirmed
    // batch 1 and make a crash-resume re-request already-confirmed work.
    expect(sessions[1].nextInput?.hotspots).toEqual(['h2'])
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

    it('a resumed run requests the saved nextParams first and keeps page and moved counts', async () => {
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
      expect(last.page).toBe(1)
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
