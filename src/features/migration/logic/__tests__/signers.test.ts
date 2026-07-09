import { signBatchTransactions } from '../signers'

// Model a tx as a set of applied signatures so routing is observable.
type FakeTx = { id: string; sigs: string[] }

const makeSigners = () => {
  const calls: string[] = []
  return {
    calls,
    signers: {
      signWithSource: async (t: FakeTx) => {
        calls.push(`source:${t.id}`)
        return { ...t, sigs: [...t.sigs, 'source'] }
      },
      signWithDestination: async (t: FakeTx) => {
        calls.push(`dest:${t.id}`)
        return { ...t, sigs: [...t.sigs, 'destination'] }
      },
    },
  }
}

describe('signBatchTransactions', () => {
  it('signs a source-only tx with the source wallet only', async () => {
    const { calls, signers } = makeSigners()
    const out = await signBatchTransactions(
      [{ tx: { id: 'a', sigs: [] }, signers: ['source'] }],
      signers,
    )
    expect(out[0].sigs).toEqual(['source'])
    expect(calls).toEqual(['source:a'])
  })

  it('signs a destination-only tx with the destination wallet only', async () => {
    const { calls, signers } = makeSigners()
    const out = await signBatchTransactions(
      [{ tx: { id: 'b', sigs: [] }, signers: ['destination'] }],
      signers,
    )
    expect(out[0].sigs).toEqual(['destination'])
    expect(calls).toEqual(['dest:b'])
  })

  it('chains both signers for a dual-signer tx, source first', async () => {
    const { calls, signers } = makeSigners()
    const out = await signBatchTransactions(
      [{ tx: { id: 'c', sigs: [] }, signers: ['source', 'destination'] }],
      signers,
    )
    expect(out[0].sigs).toEqual(['source', 'destination'])
    expect(calls).toEqual(['source:c', 'dest:c'])
  })

  it('defaults to source when signers is empty', async () => {
    const { calls, signers } = makeSigners()
    const out = await signBatchTransactions(
      [{ tx: { id: 'd', sigs: [] }, signers: [] }],
      signers,
    )
    expect(out[0].sigs).toEqual(['source'])
    expect(calls).toEqual(['source:d'])
  })

  it('preserves order across a mixed batch', async () => {
    const { signers } = makeSigners()
    const out = await signBatchTransactions(
      [
        { tx: { id: '1', sigs: [] }, signers: ['source'] },
        { tx: { id: '2', sigs: [] }, signers: ['destination'] },
        { tx: { id: '3', sigs: [] }, signers: ['source', 'destination'] },
      ],
      signers,
    )
    expect(out.map((t) => t.id)).toEqual(['1', '2', '3'])
    expect(out[2].sigs).toEqual(['source', 'destination'])
  })
})
