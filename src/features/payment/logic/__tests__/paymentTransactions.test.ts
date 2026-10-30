/**
 * Maps each payment to the signed transactions that carry it, as
 * PaymentScreen does after a batch fails. Uses the real @solana/web3.js and
 * @solana/spl-token; no mocks.
 */
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import BN from 'bn.js'
import bs58 from 'bs58'
import { batchFailure } from '../batchFailure'
import { paymentTransactions } from '../paymentTransactions'

const sender = Keypair.generate()
const recentBlockhash = PublicKey.default.toBase58()
const alice = Keypair.generate().publicKey
const bob = Keypair.generate().publicKey
const carol = Keypair.generate().publicKey
const mint = Keypair.generate().publicKey

const signed = (
  instructions: TransactionInstruction[],
  lookupTables: AddressLookupTableAccount[] = [],
) => {
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: sender.publicKey,
      recentBlockhash,
      instructions,
    }).compileToV0Message(lookupTables),
  )
  tx.sign([sender])
  return tx
}
const signatureOf = (tx: VersionedTransaction) => bs58.encode(tx.signatures[0])

const sol = (to: PublicKey, lamports: number) =>
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: to,
    lamports,
  })

const token = (to: PublicKey, amount: number) => {
  const destination = getAssociatedTokenAddressSync(mint, to, true)
  return [
    createAssociatedTokenAccountIdempotentInstruction(
      sender.publicKey,
      destination,
      to,
      mint,
    ),
    createTransferCheckedInstruction(
      getAssociatedTokenAddressSync(mint, sender.publicKey, true),
      mint,
      destination,
      sender.publicKey,
      amount,
      8,
    ),
  ]
}

const payment = (payee: PublicKey, amount: number) => ({
  payee: payee.toBase58(),
  balanceAmount: new BN(amount),
})

describe('paymentTransactions', () => {
  it('maps each SOL payment to the transaction that pays it', () => {
    const first = signed([sol(alice, 1), sol(carol, 3)])
    const second = signed([sol(bob, 2)])
    const payments = [payment(alice, 1), payment(bob, 2), payment(carol, 3)]

    expect(paymentTransactions(payments, NATIVE_MINT, [first, second])).toEqual(
      [
        { item: payments[0], signatures: [signatureOf(first)] },
        { item: payments[1], signatures: [signatureOf(second)] },
        { item: payments[2], signatures: [signatureOf(first)] },
      ],
    )
  })

  it('maps each token payment to the transactions that touch its token account', () => {
    const first = signed(token(alice, 1))
    const second = signed(token(bob, 2))
    // An oversized group can split the account create from the transfer.
    const [createCarol, transferCarol] = token(carol, 3)
    const third = signed([createCarol])
    const fourth = signed([transferCarol])
    const payments = [payment(alice, 1), payment(bob, 2), payment(carol, 3)]

    expect(
      paymentTransactions(payments, mint, [first, second, third, fourth]),
    ).toEqual([
      { item: payments[0], signatures: [signatureOf(first)] },
      { item: payments[1], signatures: [signatureOf(second)] },
      {
        item: payments[2],
        signatures: [signatureOf(third), signatureOf(fourth)],
      },
    ])
  })

  it('retries only the payment whose transaction failed after a partial batch', () => {
    const first = signed([sol(alice, 1)])
    const second = signed([sol(bob, 2)])
    const payments = [payment(alice, 1), payment(bob, 2)]

    expect(
      batchFailure(
        'partial',
        [
          { signature: signatureOf(first), status: 'confirmed' },
          { signature: signatureOf(second), status: 'failed' },
        ],
        paymentTransactions(payments, NATIVE_MINT, [first, second]),
      ),
    ).toEqual({
      kind: 'retry',
      error: new Error('Some transactions failed. Retry sends only those.'),
      failed: [payments[1]],
    })
  })

  it('offers no retry when a payee is hidden in a lookup table', () => {
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [bob],
      },
    })
    const first = signed([sol(alice, 1)])
    const second = signed([sol(bob, 2)], [lookupTable])
    const payments = [payment(alice, 1), payment(bob, 2)]

    expect(
      batchFailure(
        'partial',
        [
          { signature: signatureOf(first), status: 'confirmed' },
          { signature: signatureOf(second), status: 'failed' },
        ],
        paymentTransactions(payments, NATIVE_MINT, [first, second]),
      ),
    ).toEqual({
      kind: 'checkActivity',
      error: new Error(
        'Could not confirm which transactions went through. Check your activity.',
      ),
    })
  })

  it('retries every payment when every transaction of a lookup-table batch failed', () => {
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [bob],
      },
    })
    const first = signed([sol(alice, 1)])
    const second = signed([sol(bob, 2)], [lookupTable])
    const payments = [payment(alice, 1), payment(bob, 2)]

    expect(
      batchFailure(
        'failed',
        [
          { signature: signatureOf(first), status: 'failed' },
          { signature: signatureOf(second), status: 'failed' },
        ],
        paymentTransactions(payments, NATIVE_MINT, [first, second]),
      ),
    ).toEqual({
      kind: 'retry',
      error: new Error('Transaction failed'),
      failed: payments,
    })
  })

  it('offers no retry when a lookup-table batch reports no status for a transaction', () => {
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [bob],
      },
    })
    const first = signed([sol(alice, 1)])
    const second = signed([sol(bob, 2)], [lookupTable])
    const payments = [payment(alice, 1), payment(bob, 2)]

    expect(
      batchFailure(
        'failed',
        [{ signature: signatureOf(first), status: 'failed' }],
        paymentTransactions(payments, NATIVE_MINT, [first, second]),
      ),
    ).toEqual({
      kind: 'checkActivity',
      error: new Error(
        'Could not confirm which transactions went through. Check your activity.',
      ),
    })
  })

  it('offers no retry when a payment spans a transaction that loads its payee from a lookup table', () => {
    const [createCarol, transferCarol] = token(carol, 3)
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [getAssociatedTokenAddressSync(mint, carol, true)],
      },
    })
    const third = signed([createCarol])
    const fourth = signed([transferCarol], [lookupTable])
    const payments = [payment(carol, 3)]

    expect(
      batchFailure(
        'partial',
        [
          { signature: signatureOf(third), status: 'failed' },
          { signature: signatureOf(fourth), status: 'confirmed' },
        ],
        paymentTransactions(payments, mint, [third, fourth]),
      ),
    ).toEqual({
      kind: 'checkActivity',
      error: new Error(
        'Could not confirm which transactions went through. Check your activity.',
      ),
    })
  })
})
