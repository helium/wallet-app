import type { TransactionData } from '@helium/blockchain-api'
import i18next from 'i18next'
import en from '../../locales/en'
import {
  BatchClient,
  BatchStatus,
  PagedSubmitDeps,
  PagedSubmitError,
  PollTimeoutError,
  TerminalStatus,
  createBatchView,
  describePageFailure,
  mergeBatchStatuses,
  pollForCompletion,
  submitPages,
} from '../batchSubmit'

type Page = { transactionData: TransactionData; hasMore?: boolean }

const page = (name: string, hasMore = false): Page => ({
  transactionData: {
    transactions: [{ serializedTransaction: name }],
    parallel: false,
  } as unknown as TransactionData,
  hasMore,
})

const emptyPage: Page = {
  transactionData: {
    transactions: [],
    parallel: false,
  } as unknown as TransactionData,
}

const nameOf = (data: TransactionData) =>
  data.transactions[0].serializedTransaction

/** Fake server: serves `pages` in order and polls each batch as `statuses[batchId]`. */
const setup = ({
  pages,
  statuses = {},
  waitForLastPage = false,
}: {
  pages: Page[]
  statuses?: Record<string, TerminalStatus | 'timeout'>
  waitForLastPage?: boolean
}) => {
  const [first, ...rest] = pages
  const remaining = [...rest]
  const deps = {
    signPage: jest.fn(async (p: Page) => p.transactionData),
    submitBatch: jest.fn(async (signed: TransactionData) => {
      return `batch-${nameOf(signed)}`
    }),
    pollBatch: jest.fn(async (batchId: string) => {
      const status = statuses[batchId] ?? 'confirmed'
      if (status === 'timeout') throw new PollTimeoutError(batchId)
      return { status, signatures: [`sig-${batchId}`] }
    }),
    nextPage: jest.fn(async () => {
      const next = remaining.shift()
      if (!next) throw new Error('no more pages')
      return next
    }),
    waitForLastPage,
    describeFailure: jest.fn(
      ({ failure, page: n }) => `page ${n} ${failure.kind}`,
    ),
  } satisfies PagedSubmitDeps<Page>
  return { first, deps }
}

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (err) {
    return err
  }
  throw new Error('expected a rejection')
}

describe('submitPages', () => {
  it('signs nothing when the first page is empty', async () => {
    const { deps } = setup({ pages: [page('a')] })

    await expect(submitPages(emptyPage, deps)).resolves.toEqual({
      batchIds: [],
      signatures: [],
    })
    expect(deps.signPage).not.toHaveBeenCalled()
  })

  // The server can return a page with no transactions and hasMore: true. The
  // loop must not report that as success: nothing was sent and more remains.
  it('fails with kind empty when the first page is empty but the server says more remain', async () => {
    const { deps } = setup({ pages: [page('a')] })

    const err = await caught(submitPages({ ...emptyPage, hasMore: true }, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({
      failure: { kind: 'empty' },
      page: 1,
      confirmedCount: 0,
    })
    expect(deps.signPage).not.toHaveBeenCalled()
    expect(deps.nextPage).not.toHaveBeenCalled()
  })

  it('fails with kind empty when a later page is empty but the server says more remain', async () => {
    const { first, deps } = setup({
      pages: [page('a', true), { ...emptyPage, hasMore: true }, page('c')],
    })

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({
      failure: { kind: 'empty' },
      page: 2,
      confirmedCount: 1,
    })
    expect(deps.submitBatch).toHaveBeenCalledTimes(1)
    expect(deps.nextPage).toHaveBeenCalledTimes(1)
  })

  it('waits for each page before it fetches the next one, and returns every batch id', async () => {
    const { first, deps } = setup({
      pages: [page('a', true), page('b', true), page('c')],
    })

    const result = await submitPages(first, deps)

    expect(result.batchIds).toEqual(['batch-a', 'batch-b', 'batch-c'])
    expect(deps.pollBatch.mock.calls.map(([id]) => id)).toEqual([
      'batch-a',
      'batch-b',
    ])
  })

  it('leaves the last page to the caller unless waitForLastPage is set', async () => {
    const { first, deps } = setup({
      pages: [page('a', true), page('b')],
      waitForLastPage: true,
    })

    const result = await submitPages(first, deps)

    expect(deps.pollBatch).toHaveBeenCalledTimes(2)
    expect(result.signatures).toEqual(['sig-batch-a', 'sig-batch-b'])
  })

  it('stops on a partial page and does not fetch the next one', async () => {
    const { first, deps } = setup({
      pages: [page('a', true), page('b')],
      statuses: { 'batch-a': 'partial' },
    })

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({
      message: 'page 1 batch',
      failure: { kind: 'batch', status: 'partial' },
      page: 1,
      confirmedCount: 0,
    })
    expect(deps.nextPage).not.toHaveBeenCalled()
  })

  it.each(['failed', 'expired'] as const)(
    'reports the page and the confirmed count when page 2 is %s',
    async (status) => {
      const { first, deps } = setup({
        pages: [page('a', true), page('b', true), page('c')],
        statuses: { 'batch-b': status },
      })

      const err = await caught(submitPages(first, deps))

      expect(err).toMatchObject({
        failure: { kind: 'batch', status },
        page: 2,
        confirmedCount: 1,
      })
      expect(deps.nextPage).toHaveBeenCalledTimes(1)
    },
  )

  it('reports a polling timeout as a timeout, not a failure', async () => {
    const { first, deps } = setup({
      pages: [page('a')],
      statuses: { 'batch-a': 'timeout' },
      waitForLastPage: true,
    })

    const err = await caught(submitPages(first, deps))

    expect(err).toMatchObject({ failure: { kind: 'timeout' }, page: 1 })
  })

  it('reports any poll error after a submit as a timeout', async () => {
    const { first, deps } = setup({ pages: [page('a', true), page('b')] })
    deps.pollBatch.mockRejectedValueOnce(new Error('network'))

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({ failure: { kind: 'timeout' }, page: 1 })
  })

  it('puts the network on the error', async () => {
    const { first, deps } = setup({
      pages: [page('a')],
      statuses: { 'batch-a': 'expired' },
      waitForLastPage: true,
    })

    const err = await caught(submitPages(first, { ...deps, network: 'IOT' }))

    expect(err).toMatchObject({ page: 1, network: 'IOT' })
    expect(deps.describeFailure).toHaveBeenCalledWith(
      expect.objectContaining({ network: 'IOT' }),
    )
  })

  it('wraps a submit error with the page it failed on', async () => {
    const { first, deps } = setup({ pages: [page('a', true), page('b')] })
    const cause = new Error('503')
    deps.submitBatch.mockResolvedValueOnce('batch-a')
    deps.submitBatch.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toMatchObject({
      failure: { kind: 'submit', cause },
      page: 2,
      confirmedCount: 1,
    })
  })

  // The fields of an oRPC defined error from POST /transactions (the submit
  // error map in @helium/blockchain-api errors.d.ts).
  const serverError = (
    code: string,
    status: number,
    data: Record<string, unknown> = {},
  ) => Object.assign(new Error(code), { defined: true, code, status, data })

  // The server throws these only before it sends anything (submit.ts): the
  // blockhash probe, the pre-send simulation, and the Jito bundle simulation,
  // which runs before the atomic bundle is sent.
  it.each([
    [
      'a BLOCKHASH_EXPIRED from the blockhash probe',
      serverError('BLOCKHASH_EXPIRED', 400, { failedTransactionIndex: 1 }),
    ],
    [
      'a SIMULATION_FAILED from the pre-send simulation',
      serverError('SIMULATION_FAILED', 400, { logs: ['log'] }),
    ],
    [
      'a SIMULATION_FAILED from the bundle simulation',
      serverError('SIMULATION_FAILED', 400, {
        logs: ['log'],
        failedTransactionIndex: 2,
      }),
    ],
  ])('wraps %s as kind rejected', async (_label, cause) => {
    const { first, deps } = setup({ pages: [page('a')] })
    deps.submitBatch.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({ failure: { kind: 'rejected', cause } })
  })

  // The server uses BAD_REQUEST both before any send and for every error after
  // sending started (submit.ts), so a transaction can have landed.
  it.each([
    ['a BAD_REQUEST', serverError('BAD_REQUEST', 400)],
    [
      'a 400 that is not a defined error',
      Object.assign(new Error('Transaction simulation failed.'), {
        defined: false,
        code: 'SIMULATION_FAILED',
        status: 400,
      }),
    ],
    [
      'a plain 400',
      Object.assign(new Error('bad request'), {
        status: 400,
        data: { failedTransactionIndex: 0 },
      }),
    ],
    ['a 408', Object.assign(new Error('timed out'), { status: 408 })],
    ['a CONFLICT', serverError('CONFLICT', 409)],
    ['a 429', Object.assign(new Error('rate limited'), { status: 429 })],
    ['a 500', Object.assign(new Error('server error'), { status: 500 })],
    ['a status-less', new Error('network')],
  ])('wraps %s submit error as kind submit', async (_label, cause) => {
    const { first, deps } = setup({ pages: [page('a')] })
    deps.submitBatch.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({ failure: { kind: 'submit', cause } })
  })

  it('passes a sign rejection through unchanged', async () => {
    const { first, deps } = setup({ pages: [page('a')] })
    const rejection = new Error('User rejected transaction')
    deps.signPage.mockRejectedValueOnce(rejection)

    await expect(submitPages(first, deps)).rejects.toBe(rejection)
    expect(deps.submitBatch).not.toHaveBeenCalled()
  })

  it('wraps a next-page error after a confirmed page as kind request', async () => {
    const { first, deps } = setup({ pages: [page('a', true), page('b')] })
    const cause = new Error('network')
    deps.nextPage.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({
      failure: { kind: 'request', cause },
      page: 2,
      confirmedCount: 1,
    })
  })

  it('wraps a sign error on page 2 as kind sign', async () => {
    const { first, deps } = setup({ pages: [page('a', true), page('b')] })
    const cause = new Error('User rejected transaction')
    deps.signPage.mockImplementationOnce(async (p: Page) => p.transactionData)
    deps.signPage.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({ failure: { kind: 'sign', cause }, page: 2 })
  })

  it('throws a page-1 sign error as is, not as a PagedSubmitError', async () => {
    const { first, deps } = setup({ pages: [page('a', true), page('b')] })
    const cause = new Error('User rejected transaction')
    deps.signPage.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBe(cause)
    expect(err).not.toBeInstanceOf(PagedSubmitError)
  })

  it('stops after a page with hasMore when there is no nextPage', async () => {
    const { first, deps } = setup({ pages: [page('a', true)] })

    const result = await submitPages(first, { ...deps, nextPage: undefined })

    expect(result.batchIds).toEqual(['batch-a'])
    expect(deps.pollBatch).not.toHaveBeenCalled()
  })
})

describe('pagedSubmit copy', () => {
  const i18n = i18next.createInstance()
  beforeAll(async () => {
    await i18n.init({
      compatibilityJSON: 'v3',
      lng: 'en',
      resources: { en: { translation: en } },
    })
  })

  it.each(['confirmedBefore', 'sentBefore'] as const)(
    'picks the singular and _plural %s copy by count',
    (key) => {
      const copy = en.transactions.pagedSubmit
      expect(i18n.t(`transactions.pagedSubmit.${key}`, { count: 1 })).toBe(
        copy[key].replace('{{count}}', '1'),
      )
      expect(i18n.t(`transactions.pagedSubmit.${key}`, { count: 2 })).toBe(
        copy[`${key}_plural`].replace('{{count}}', '2'),
      )
    },
  )

  it('does not escape the submit reason', () => {
    const reason = "Request to https://api/x failed: can't"
    expect(
      describePageFailure(i18n.t, {
        failure: { kind: 'submit', cause: new Error(reason) },
        page: 2,
        confirmedCount: 0,
      }),
    ).toContain(reason)
  })

  it.each(['sign', 'request'] as const)(
    'names the reason for a %s failure on any page',
    (kind) => {
      const failure = { kind, cause: new Error('User rejected') }
      expect(
        describePageFailure(i18n.t, { failure, page: 2, confirmedCount: 0 }),
      ).toContain('User rejected')
      expect(
        describePageFailure(i18n.t, { failure, page: 1, confirmedCount: 0 }),
      ).toContain('User rejected')
    },
  )

  it('tells the user a submit failure may have sent and to check Activity', () => {
    const failure = { kind: 'submit', cause: new Error('503') } as const
    const later = describePageFailure(i18n.t, {
      failure,
      page: 2,
      confirmedCount: 0,
    })
    expect(later).toContain('Could not confirm batch 2 was sent')
    expect(later).toContain('Check Activity before you try again')
    expect(
      describePageFailure(i18n.t, { failure, page: 1, confirmedCount: 0 }),
    ).toContain('Could not confirm the transaction was sent')
  })

  it('tells the user the server returned no transactions to send', () => {
    const failure = { kind: 'empty' } as const
    expect(
      describePageFailure(i18n.t, { failure, page: 1, confirmedCount: 0 }),
    ).toBe('The server returned no transactions to send. Nothing was sent.')
    expect(
      describePageFailure(i18n.t, { failure, page: 3, confirmedCount: 0 }),
    ).toBe(
      'The server returned no transactions to send for batch 3. Nothing was sent for that batch.',
    )
  })

  it('tells the user a rejected page was rejected, with the network and what earlier networks sent', () => {
    const copy = en.transactions.pagedSubmit
    expect(
      describePageFailure(
        i18n.t,
        {
          failure: {
            kind: 'rejected',
            cause: new Error('SIMULATION_FAILED'),
          },
          page: 2,
          confirmedCount: 0,
          network: 'IOT',
        },
        1,
      ),
    ).toBe(
      [
        copy.network.replace('{{network}}', 'IOT'),
        copy.rejectedPage
          .replace('{{page}}', '2')
          .replace('{{reason}}', 'SIMULATION_FAILED'),
        copy.sentBefore.replace('{{count}}', '1'),
      ].join(' '),
    )
  })

  it('tells the user a first page was rejected, ending in one period', () => {
    const message = describePageFailure(i18n.t, {
      failure: {
        kind: 'rejected',
        cause: new Error('Transaction simulation failed.'),
      },
      page: 1,
      confirmedCount: 0,
    })
    expect(message).toBe(
      en.transactions.pagedSubmit.rejected.replace(
        '{{reason}}',
        'Transaction simulation failed',
      ),
    )
    expect(message).toMatch(/[^.]\.$/)
  })
})

describe('describePageFailure', () => {
  const t = (key: string, options?: Record<string, unknown>) =>
    options ? `${key}${JSON.stringify(options)}` : key

  it('uses the plain copy for a first page with nothing before it', () => {
    expect(
      describePageFailure(t, {
        failure: { kind: 'batch', status: 'failed' },
        page: 1,
        confirmedCount: 0,
      }),
    ).toBe('transactions.pagedSubmit.failed')
  })

  it('names the network, the page, what confirmed before it and what earlier networks sent', () => {
    expect(
      describePageFailure(
        t,
        {
          failure: { kind: 'timeout' },
          page: 2,
          confirmedCount: 1,
          network: 'IOT',
        },
        3,
      ),
    ).toBe(
      [
        'transactions.pagedSubmit.network{"network":"IOT"}',
        'transactions.pagedSubmit.timeoutPage{"page":2}',
        'transactions.pagedSubmit.confirmedBefore{"count":1}',
        'transactions.pagedSubmit.sentBefore{"count":3}',
      ].join(' '),
    )
  })

  it('includes the submit error reason', () => {
    expect(
      describePageFailure(t, {
        failure: { kind: 'submit', cause: new Error('503') },
        page: 1,
        confirmedCount: 0,
      }),
    ).toBe(
      'transactions.pagedSubmit.submit{"reason":"503","interpolation":{"escapeValue":false}}',
    )
  })
})

describe('pollForCompletion', () => {
  type Row = { signature: string; status: string }
  type Read = { status: string; transactions: Row[] }

  const row = (status: string, signature = 'sig'): Row => ({
    signature,
    status,
  })

  /**
   * Fake GET /transactions/{id}: serves `reads` in order, then repeats the
   * last one. Each read moves the clock 2 s on, like the real poll interval.
   */
  const clientWith = (...reads: Read[]) => {
    let clock = 0
    jest.spyOn(Date, 'now').mockImplementation(() => clock)
    let calls = 0
    const get = jest.fn(async () => {
      const read = reads[Math.min(calls, reads.length - 1)]
      calls += 1
      clock += 2000
      return read
    })
    return { client: { transactions: { get } } as unknown as BatchClient, get }
  }

  afterEach(() => jest.restoreAllMocks())

  it('polls until the batch settles', async () => {
    const { client, get } = clientWith(
      { status: 'pending', transactions: [row('pending')] },
      { status: 'confirmed', transactions: [row('confirmed')] },
    )

    await expect(pollForCompletion(client, 'b', 0)).resolves.toEqual({
      status: 'confirmed',
      signatures: ['sig'],
    })
    expect(get).toHaveBeenCalledTimes(2)
  })

  // The server rolls a batch up to partial or failed as soon as one row failed,
  // even with other rows still pending (rollupBatchStatus).
  it.each([
    [
      'partial',
      [row('confirmed', 'a'), row('failed', 'b'), row('pending', 'c')],
    ],
    ['failed', [row('failed', 'a'), row('pending', 'b')]],
  ])(
    'keeps polling a %s batch while a row is still pending',
    async (status, transactions) => {
      const settled = transactions.map((tx) =>
        tx.status === 'pending' ? { ...tx, status: 'confirmed' } : tx,
      )
      const { client, get } = clientWith(
        { status, transactions },
        { status: 'partial', transactions: settled },
      )

      await expect(pollForCompletion(client, 'b', 0)).resolves.toMatchObject({
        status: 'partial',
      })
      expect(get).toHaveBeenCalledTimes(2)
    },
  )

  // The server does not treat an expired row as settled: a later read can find
  // the transaction on the cluster and flip the row to confirmed.
  it('does not settle on an expired row that a later read confirms', async () => {
    const { client, get } = clientWith(
      { status: 'failed', transactions: [row('expired')] },
      { status: 'failed', transactions: [row('expired')] },
      { status: 'confirmed', transactions: [row('confirmed')] },
    )

    await expect(pollForCompletion(client, 'b', 0)).resolves.toEqual({
      status: 'confirmed',
      signatures: ['sig'],
    })
    expect(get).toHaveBeenCalledTimes(3)
  })

  it('settles on an expired row once it has read expired for 10 seconds', async () => {
    const { client, get } = clientWith({
      status: 'failed',
      transactions: [row('expired')],
    })

    await expect(pollForCompletion(client, 'b', 0)).resolves.toEqual({
      status: 'failed',
      signatures: ['sig'],
    })
    // First seen expired on read 1, so read 6, 10 s later, settles it.
    expect(get).toHaveBeenCalledTimes(6)
  })

  it('restarts the wait when an expired row stops reading expired', async () => {
    const expired = { status: 'failed', transactions: [row('expired')] }
    const { client, get } = clientWith(
      expired,
      expired,
      expired,
      { status: 'pending', transactions: [row('pending')] },
      expired,
    )

    await expect(pollForCompletion(client, 'b', 0)).resolves.toMatchObject({
      status: 'failed',
    })
    // Seen expired again on read 5, so read 10, 10 s later, settles it.
    expect(get).toHaveBeenCalledTimes(10)
  })

  it('throws PollTimeoutError when the batch is still unsettled at the time limit', async () => {
    const { client } = clientWith({
      status: 'partial',
      transactions: [row('confirmed', 'a'), row('expired', 'b')],
    })

    const err = await caught(pollForCompletion(client, 'b', 0, 6000))

    expect(err).toBeInstanceOf(PollTimeoutError)
    expect(err).toMatchObject({
      batchId: 'b',
      message: 'Transaction polling timeout',
    })
  })

  it('throws PollTimeoutError when the batch never lands', async () => {
    const { client } = clientWith({
      status: 'pending',
      transactions: [row('pending')],
    })

    const err = await caught(pollForCompletion(client, 'b', 0, 0))

    expect(err).toBeInstanceOf(PollTimeoutError)
    expect(err).toMatchObject({
      batchId: 'b',
      message: 'Transaction polling timeout',
    })
  })
})

describe('createBatchView', () => {
  it('keeps a confirmed batch confirmed while a row reads pending', () => {
    const view = createBatchView()
    expect(
      view({
        status: 'confirmed',
        transactions: [
          { signature: 'a', status: 'confirmed' },
          { signature: 'b', status: 'pending' },
        ],
      }).status,
    ).toBe('confirmed')
  })
})

describe('mergeBatchStatuses', () => {
  it.each<[BatchStatus[], BatchStatus | undefined]>([
    [[], undefined],
    [['confirmed', 'confirmed'], 'confirmed'],
    [['confirmed', 'pending'], 'pending'],
    [['confirmed', 'failed'], 'partial'],
    [['expired', 'expired'], 'expired'],
  ])('merges %j into %s', (statuses, expected) => {
    expect(mergeBatchStatuses(statuses)).toBe(expected)
  })
})
