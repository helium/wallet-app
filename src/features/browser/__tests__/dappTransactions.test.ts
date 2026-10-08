/**
 * The guards BrowserWebViewScreen runs on a dApp's sign request before it
 * shows the approval sheet. Uses the real @solana/web3.js; no mocks.
 */
import { SolanaSignAndSendTransactionInput } from '@solana/wallet-standard-features'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  deserializeTransactionInputs,
  hasUnsupportedTransaction,
  sendInSequence,
} from '../dappTransactions'

const payer = Keypair.generate().publicKey
const to = Keypair.generate().publicKey
const recentBlockhash = PublicKey.default.toBase58()
const ix = SystemProgram.transfer({
  fromPubkey: payer,
  toPubkey: to,
  lamports: 1,
})

const legacyBytes = new Transaction({ feePayer: payer, recentBlockhash })
  .add(ix)
  .serialize({ requireAllSignatures: false })

const v0Bytes = new VersionedTransaction(
  new TransactionMessage({
    payerKey: payer,
    recentBlockhash,
    instructions: [ix],
  }).compileToV0Message(),
).serialize()

// Hand-built: web3.js 1.x decodes v1 messages but cannot serialize them
const v1Bytes = new Uint8Array([
  0x81, // version prefix
  ...[1, 0, 1], // header
  ...[0, 0, 0, 0], // config mask
  ...PublicKey.default.toBytes(), // blockhash
  1, // instruction count
  3, // account key count
  ...payer.toBytes(),
  ...to.toBytes(),
  ...SystemProgram.programId.toBytes(),
  // instruction: program index, account count, data length (u16 LE)
  ...[2, 2, ix.data.length, 0],
  ...[0, 1], // account indexes
  ...ix.data,
  ...new Array(64).fill(0), // one empty signature
])

// Bytes that Transaction.from reads and VersionedTransaction.deserialize does not
const legacyOnlyBytes = new Uint8Array([
  0x81,
  0x00,
  ...new Array(64).fill(0).map((v, i) => (i === 2 ? 0x20 : v)),
  ...new Transaction({ feePayer: payer, recentBlockhash })
    .add(ix)
    .serializeMessage(),
])

// A Uint8Array crosses the WebView bridge as {0: .., 1: ..}
const asInput = (bytes: Uint8Array) =>
  ({
    transaction: { ...Array.from(bytes) },
    chain: 'solana:mainnet',
    options: {},
  } as unknown as SolanaSignAndSendTransactionInput)

const isUnsupported = async (...txs: Uint8Array[]) => {
  const { transactions } = await deserializeTransactionInputs(txs.map(asInput))
  return hasUnsupportedTransaction(transactions)
}

describe('dApp transaction guards', () => {
  test('accepts a legacy transaction', async () => {
    expect(await isUnsupported(legacyBytes)).toBe(false)
  })

  test('accepts a v0 transaction', async () => {
    expect(await isUnsupported(v0Bytes)).toBe(false)
  })

  test('rejects a v1 transaction', async () => {
    expect(await isUnsupported(v1Bytes)).toBe(true)
  })

  test('rejects a batch that holds a v1 transaction', async () => {
    expect(await isUnsupported(v0Bytes, v1Bytes)).toBe(true)
  })

  test('decodes a legacy transaction the way the sign sheet does', async () => {
    const { transactions, isVersioned } = await deserializeTransactionInputs([
      asInput(legacyBytes),
    ])

    expect(isVersioned).toBe(true)
    expect(transactions[0].transaction).toBeInstanceOf(VersionedTransaction)
  })

  test('fails to decode bytes that the sign sheet cannot decode', async () => {
    expect(() => Transaction.from(legacyOnlyBytes)).not.toThrow()
    await expect(
      deserializeTransactionInputs([asInput(legacyOnlyBytes)]),
    ).rejects.toThrow()
  })

  test('fails to decode bytes that are not a transaction', async () => {
    await expect(
      deserializeTransactionInputs([asInput(new Uint8Array([1, 2, 3]))]),
    ).rejects.toThrow()
  })
})

describe('sendInSequence', () => {
  it('sends in order and returns every signature', async () => {
    const calls: string[] = []
    const result = await sendInSequence(['a', 'b', 'c'], async (item) => {
      calls.push(item)
      return `sig-${item}`
    })

    expect(calls).toEqual(['a', 'b', 'c'])
    expect(result).toEqual(['sig-a', 'sig-b', 'sig-c'])
  })

  it('does not start a send before the previous one settles', async () => {
    let active = 0
    let maxActive = 0
    await sendInSequence(['a', 'b'], async (item) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 1))
      active -= 1
      return item
    })

    expect(maxActive).toBe(1)
  })

  it('rethrows the error when the first send fails', async () => {
    await expect(
      sendInSequence(['a', 'b'], async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow(/^boom$/)
  })

  it('names the signatures already sent and stops when a later send fails', async () => {
    const calls: string[] = []
    await expect(
      sendInSequence(['a', 'b', 'c'], async (item) => {
        calls.push(item)
        if (item === 'b') throw new Error('boom')
        return `sig-${item}`
      }),
    ).rejects.toThrow('Sent 1 of 3 transactions (sig-a), then failed: boom')

    expect(calls).toEqual(['a', 'b'])
  })
})
