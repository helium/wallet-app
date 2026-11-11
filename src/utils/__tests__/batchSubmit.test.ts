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

  it('wraps a definite 4xx submit error as kind rejected', async () => {
    const { first, deps } = setup({ pages: [page('a')] })
    const cause = Object.assign(new Error('Transaction simulation failed.'), {
      status: 400,
    })
    deps.submitBatch.mockRejectedValueOnce(cause)

    const err = await caught(submitPages(first, deps))

    expect(err).toBeInstanceOf(PagedSubmitError)
    expect(err).toMatchObject({ failure: { kind: 'rejected', cause } })
  })

  it.each([
    [1, 'submit'],
    [0, 'rejected'],
  ])(
    'wraps a 400 with failedTransactionIndex %i as kind %s',
    async (failedTransactionIndex, kind) => {
      const { first, deps } = setup({ pages: [page('a')] })
      const cause = Object.assign(new Error('Transaction simulation failed.'), {
        status: 400,
        data: { failedTransactionIndex },
      })
      deps.submitBatch.mockRejectedValueOnce(cause)

      const err = await caught(submitPages(first, deps))

      expect(err).toMatchObject({ failure: { kind, cause } })
    },
  )

  it.each([
    ['a 408', Object.assign(new Error('timed out'), { status: 408 })],
    ['a 409', Object.assign(new Error('already exists'), { status: 409 })],
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
  const clientWith = (...statuses: string[]) => {
    const get = jest.fn()
    statuses.forEach((status) =>
      get.mockResolvedValueOnce({
        status,
        transactions: [{ signature: 'sig' }],
      }),
    )
    return { client: { transactions: { get } } as unknown as BatchClient, get }
  }

  it('polls until the batch reaches a terminal status', async () => {
    const { client, get } = clientWith('pending', 'partial')

    await expect(pollForCompletion(client, 'b', 0)).resolves.toEqual({
      status: 'partial',
      signatures: ['sig'],
    })
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('throws PollTimeoutError when the batch never lands', async () => {
    const { client } = clientWith()

    const err = await caught(pollForCompletion(client, 'b', 0, 0))

    expect(err).toBeInstanceOf(PollTimeoutError)
    expect(err).toMatchObject({
      batchId: 'b',
      message: 'Transaction polling timeout',
    })
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
