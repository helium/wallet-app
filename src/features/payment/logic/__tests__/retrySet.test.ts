import { batchFailure } from '../batchFailure'
import { retrySet } from '../retrySet'

const sent = [
  { item: 'alice', signatures: ['sigA'] },
  { item: 'bob', signatures: ['sigB'] },
]
const partialRows = [
  { signature: 'sigA', status: 'confirmed' as const },
  { signature: 'sigB', status: 'failed' as const },
]

describe('retrySet', () => {
  it('sends every item when nothing failed and nothing was sent', () => {
    expect(retrySet(undefined, undefined, ['alice', 'bob'])).toEqual([
      'alice',
      'bob',
    ])
  })

  it('sends only the failed items after a partial batch', () => {
    const failure = batchFailure('partial', partialRows, sent)

    expect(retrySet(failure, undefined, ['alice', 'bob'])).toEqual(['bob'])
  })

  it('offers no Retry after an expired batch', () => {
    const failure = batchFailure(
      'expired',
      [
        { signature: 'sigA', status: 'expired' },
        { signature: 'sigB', status: 'expired' },
      ],
      sent,
    )

    expect(retrySet(failure, undefined, ['alice', 'bob'])).toBeUndefined()
  })

  it('resends the stored set, not every item, after a failed Retry', () => {
    const failure = batchFailure('partial', partialRows, sent)
    const unsent = retrySet(failure, undefined, ['alice', 'bob'])
    expect(unsent).toEqual(['bob'])

    // The Retry mutation throws, so no batch settles and no failure exists.
    expect(retrySet(undefined, unsent, ['alice', 'bob'])).toEqual(['bob'])
  })
})
