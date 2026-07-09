import { VersionedTransaction } from '@solana/web3.js'
import {
  deserializeBatchTxs,
  serializeSignedBatch,
  summarizeBatch,
} from '../batches'

describe('summarizeBatch', () => {
  it('splits confirmed vs failed transaction signatures', () => {
    const r = summarizeBatch({
      status: 'partial',
      transactions: [
        { signature: 'sigA', status: 'confirmed' },
        { signature: 'sigB', status: 'failed' },
        { signature: 'sigC', status: 'confirmed' },
      ],
    })
    expect(r.confirmedSignatures).toEqual(['sigA', 'sigC'])
    expect(r.failedSignatures).toEqual(['sigB'])
  })

  it('treats non-confirmed statuses as failed', () => {
    const r = summarizeBatch({
      status: 'expired',
      transactions: [{ signature: 'x', status: 'expired' }],
    })
    expect(r.confirmedSignatures).toEqual([])
    expect(r.failedSignatures).toEqual(['x'])
  })
})

describe('deserializeBatchTxs', () => {
  it('reads metadata.signers, defaulting missing metadata to source', () => {
    const items = deserializeBatchTxs({
      parallel: false,
      transactions: [
        {
          serializedTransaction: 'AA==',
          metadata: { signers: ['source', 'destination'] },
        },
        { serializedTransaction: 'AA==' },
      ],
    })
    expect(items[0].signers).toEqual(['source', 'destination'])
    expect(items[1].signers).toEqual(['source'])
    // guard: VersionedTransaction was invoked (mocked below), one per tx
    expect(
      (VersionedTransaction.deserialize as jest.Mock).mock.calls,
    ).toHaveLength(2)
  })
})

describe('serializeSignedBatch', () => {
  it('re-serializes signed txs and carries forward submit metadata', () => {
    const signed = [
      { serialize: () => new Uint8Array([1, 2, 3]) },
    ] as unknown as VersionedTransaction[]
    const out = serializeSignedBatch(signed, {
      parallel: true,
      tag: 'migrate',
      transactions: [
        {
          serializedTransaction: 'old',
          metadata: { type: 'transfer', description: 'd' },
        },
      ],
    })
    expect(out.parallel).toBe(true)
    expect(out.tag).toBe('migrate')
    expect(out.transactions[0].metadata).toEqual({
      type: 'transfer',
      description: 'd',
    })
    expect(typeof out.transactions[0].serializedTransaction).toBe('string')
  })
})

// Mock only the deserialize entry point; keep the rest of web3.js real.
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  VersionedTransaction: { deserialize: jest.fn(() => ({ mock: true })) },
}))
