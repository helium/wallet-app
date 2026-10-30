import { batchFailure } from '../batchFailure'

const CHECK_ACTIVITY =
  'Could not confirm which transactions went through. Check your activity.'

describe('batchFailure on PaymentScreen', () => {
  it('retries only the payments whose transaction failed after a partial batch', () => {
    const failure = batchFailure(
      'partial',
      [
        { signature: 'sigA', status: 'confirmed' },
        { signature: 'sigB', status: 'failed' },
      ],
      [
        { item: 'alice', signatures: ['sigA'] },
        { item: 'bob', signatures: ['sigB'] },
        { item: 'carol', signatures: ['sigA'] },
      ],
    )

    expect(failure).toEqual({
      kind: 'retry',
      error: new Error('Some transactions failed. Retry sends only those.'),
      failed: ['bob'],
    })
  })
})

describe('batchFailure when the app cannot tell what landed', () => {
  const checkActivity = {
    kind: 'checkActivity',
    error: new Error(CHECK_ACTIVITY),
  }
  const alice = { item: 'alice', signatures: ['sigA'] }
  const bob = { item: 'bob', signatures: ['sigB'] }

  it('offers no retry for an expired batch', () => {
    expect(
      batchFailure(
        'expired',
        [
          { signature: 'sigA', status: 'failed' },
          { signature: 'sigB', status: 'failed' },
        ],
        [alice, bob],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when a transaction expired, since it can still land', () => {
    expect(
      batchFailure(
        'partial',
        [
          { signature: 'sigA', status: 'confirmed' },
          { signature: 'sigB', status: 'expired' },
        ],
        [alice, bob],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when a transaction is still pending', () => {
    expect(
      batchFailure(
        'partial',
        [
          { signature: 'sigA', status: 'failed' },
          { signature: 'sigB', status: 'pending' },
        ],
        [alice, bob],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when one item spans a landed and a failed transaction', () => {
    expect(
      batchFailure(
        'partial',
        [
          { signature: 'sigA', status: 'confirmed' },
          { signature: 'sigB', status: 'failed' },
        ],
        [{ item: 'alice', signatures: ['sigA', 'sigB'] }],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when an item maps to no transaction', () => {
    expect(
      batchFailure(
        'partial',
        [
          { signature: 'sigA', status: 'confirmed' },
          { signature: 'sigB', status: 'failed' },
        ],
        [alice, bob, { item: 'carol', signatures: [] }],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when an item maps to a transaction the batch does not report', () => {
    expect(
      batchFailure(
        'failed',
        [{ signature: 'sigB', status: 'failed' }],
        [{ item: 'bob', signatures: ['sigX'] }],
      ),
    ).toEqual(checkActivity)
  })

  it('offers no retry when no failed transaction carries an item', () => {
    expect(
      batchFailure(
        'partial',
        [
          { signature: 'sigA', status: 'confirmed' },
          { signature: 'sigTip', status: 'failed' },
        ],
        [alice],
      ),
    ).toEqual(checkActivity)
  })
})

// The delegate goes out as one transaction, so every transaction the batch
// reports carries it, as BurnScreen passes it.
describe('batchFailure on BurnScreen', () => {
  const delegateBatch = (
    status: Parameters<typeof batchFailure>[0],
    transactions: Parameters<typeof batchFailure>[1],
  ) =>
    batchFailure(status, transactions, [
      { item: 'delegate', signatures: transactions.map((t) => t.signature) },
    ])

  it('retries the delegate when its transaction failed', () => {
    expect(
      delegateBatch('failed', [{ signature: 'sigD', status: 'failed' }]),
    ).toEqual({
      kind: 'retry',
      error: new Error('Transaction failed'),
      failed: ['delegate'],
    })
  })

  it('offers no retry after a partial batch, since part of the delegate landed', () => {
    expect(
      delegateBatch('partial', [
        { signature: 'sigD', status: 'confirmed' },
        { signature: 'sigE', status: 'failed' },
      ]),
    ).toEqual({ kind: 'checkActivity', error: new Error(CHECK_ACTIVITY) })
  })

  it('offers no retry when the delegate expired', () => {
    expect(
      delegateBatch('expired', [{ signature: 'sigD', status: 'expired' }]),
    ).toEqual({ kind: 'checkActivity', error: new Error(CHECK_ACTIVITY) })
  })

  it('reports no failure while the batch is pending or confirmed', () => {
    expect(
      delegateBatch('pending', [{ signature: 'sigD', status: 'pending' }]),
    ).toBeUndefined()
    expect(
      delegateBatch('confirmed', [{ signature: 'sigD', status: 'confirmed' }]),
    ).toBeUndefined()
  })
})
