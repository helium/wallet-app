import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from '@solana/web3.js'
import { EnrichedTransaction } from '../../../../types/solana'
import { attachSigners, signersOf } from '../signers'
import enhanced from './fixtures/v0.json'
import parsedEvents from './fixtures/v1.json'

// /v1 answers in request order, so its signatures are the request order.
const requestOrder = parsedEvents.map((item) => item.signature)

describe('attachSigners', () => {
  it('gives each transaction its own signers when the response order differs from the request', () => {
    const response = enhanced as unknown as EnrichedTransaction[]
    expect(response.map((tx) => tx.signature)).not.toEqual(requestOrder)

    const signed = attachSigners(
      response,
      requestOrder.map((signature) => ({
        signature,
        signers: [`signer-of-${signature}`],
      })),
    )

    signed.forEach((tx) => {
      expect(tx.signers).toEqual([`signer-of-${tx.signature}`])
    })
  })

  it('gives no signers to a transaction the signature list does not have', () => {
    const response = enhanced as unknown as EnrichedTransaction[]

    const [signed] = attachSigners(response.slice(0, 1), [])

    expect(signed.signers).toEqual([])
  })
})

describe('signersOf', () => {
  it('reads the signers of a v0 message that loads accounts from a lookup table', () => {
    const feePayer = Keypair.generate().publicKey
    const authority = Keypair.generate().publicKey
    const lookedUp = Keypair.generate().publicKey
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [lookedUp],
      },
    })
    const message = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: PublicKey.default.toBase58(),
      instructions: [
        new TransactionInstruction({
          programId: Keypair.generate().publicKey,
          keys: [
            { pubkey: authority, isSigner: true, isWritable: false },
            { pubkey: lookedUp, isSigner: false, isWritable: true },
          ],
        }),
      ],
    }).compileToV0Message([lookupTable])
    expect(message.addressTableLookups).toHaveLength(1)

    // The fee payer signs although no instruction references it.
    expect(signersOf(message)).toEqual([
      feePayer.toBase58(),
      authority.toBase58(),
    ])
  })
})
