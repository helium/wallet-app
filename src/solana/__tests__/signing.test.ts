import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { assertSignedBy, signWithKeypair } from '../signing'

const BLOCKHASH = '11111111111111111111111111111111'

const versionedTx = (payer: PublicKey) =>
  new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer,
      recentBlockhash: BLOCKHASH,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1,
        }),
      ],
    }).compileToV0Message(),
  )

const legacyTx = (payer: PublicKey) => {
  const tx = new Transaction({ feePayer: payer, recentBlockhash: BLOCKHASH })
  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    }),
  )
  return tx
}

describe('signWithKeypair', () => {
  it('signs a versioned tx so the fee payer slot verifies', () => {
    const user = Keypair.generate()
    const tx = signWithKeypair(
      versionedTx(user.publicKey),
      user.publicKey,
      user,
    )
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
  })

  it('signs a legacy tx so the fee payer slot verifies', () => {
    const user = Keypair.generate()
    const tx = signWithKeypair(legacyTx(user.publicKey), user.publicKey, user)
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
  })

  it('throws when there is no key', () => {
    const user = Keypair.generate()
    expect(() =>
      signWithKeypair(versionedTx(user.publicKey), user.publicKey, undefined),
    ).toThrow()
  })

  it('throws when the key belongs to another account', () => {
    const user = Keypair.generate()
    const other = Keypair.generate()
    expect(() =>
      signWithKeypair(versionedTx(user.publicKey), user.publicKey, other),
    ).toThrow(/does not match/)
  })
})

describe('assertSignedBy', () => {
  it('throws on an unsigned versioned tx', () => {
    const user = Keypair.generate()
    expect(() =>
      assertSignedBy(versionedTx(user.publicKey), user.publicKey),
    ).toThrow(/not signed/)
  })

  it('throws on an unsigned legacy tx', () => {
    const user = Keypair.generate()
    expect(() =>
      assertSignedBy(legacyTx(user.publicKey), user.publicKey),
    ).toThrow(/not signed/)
  })

  it('throws when the slot holds a signature by another key', () => {
    const user = Keypair.generate()
    const other = Keypair.generate()
    const tx = versionedTx(user.publicKey)
    // Mimic Ledger/Keystone: a device signature placed by pubkey, unchecked
    const signed = versionedTx(other.publicKey)
    signed.sign([other])
    tx.addSignature(user.publicKey, signed.signatures[0])
    expect(() => assertSignedBy(tx, user.publicKey)).toThrow(/not signed/)
  })

  it('throws when the message changed after signing', () => {
    const user = Keypair.generate()
    const tx = signWithKeypair(
      versionedTx(user.publicKey),
      user.publicKey,
      user,
    )
    tx.message.recentBlockhash = Keypair.generate().publicKey.toBase58()
    expect(() => assertSignedBy(tx, user.publicKey)).toThrow(/not signed/)
  })
})
