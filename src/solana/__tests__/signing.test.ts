import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  assertSignedBy,
  isRequiredSigner,
  signAsAccount,
  signMessageAsAccount,
  signWithKeypair,
} from '../signing'
import { signMessageEd25519, verifyEd25519 } from '../../utils/crypto'

const BLOCKHASH = '11111111111111111111111111111111'

const versionedTx = (payer: PublicKey, from = payer) =>
  new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer,
      recentBlockhash: BLOCKHASH,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1,
        }),
      ],
    }).compileToV0Message(),
  )

const legacyTx = (payer: PublicKey, from = payer) => {
  const tx = new Transaction({ feePayer: payer, recentBlockhash: BLOCKHASH })
  tx.add(
    SystemProgram.transfer({
      fromPubkey: from,
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

  it('signs the wallet slot of a versioned tx paid by another account', () => {
    const user = Keypair.generate()
    const payer = Keypair.generate()
    const tx = signWithKeypair(
      versionedTx(payer.publicKey, user.publicKey),
      user.publicKey,
      user,
    )
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
    expect(() => assertSignedBy(tx, payer.publicKey)).toThrow(/not signed/)
  })

  it('signs the wallet slot of a legacy tx paid by another account', () => {
    const user = Keypair.generate()
    const payer = Keypair.generate()
    const tx = signWithKeypair(
      legacyTx(payer.publicKey, user.publicKey),
      user.publicKey,
      user,
    )
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
    expect(() => assertSignedBy(tx, payer.publicKey)).toThrow(/not signed/)
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

// A transfer to the wallet: the wallet is a writable non-signer
const transferTo = (payer: PublicKey, to: PublicKey) =>
  SystemProgram.transfer({ fromPubkey: payer, toPubkey: to, lamports: 1 })

// Serializes an unsigned legacy tx and reads it back the way the browser does
const asBrowserBytes = (tx: Transaction) =>
  VersionedTransaction.deserialize(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
  )

describe('isRequiredSigner', () => {
  const payer = Keypair.generate().publicKey
  const user = Keypair.generate().publicKey

  it('is true for a versioned tx the wallet signs but does not pay', () => {
    expect(isRequiredSigner(versionedTx(payer, user), user)).toBe(true)
  })

  it('is true for a versioned tx the wallet pays', () => {
    expect(isRequiredSigner(versionedTx(user), user)).toBe(true)
  })

  it('is false for a versioned tx without the wallet', () => {
    expect(isRequiredSigner(versionedTx(payer), user)).toBe(false)
  })

  it('is false for a versioned tx that only credits the wallet', () => {
    const tx = new VersionedTransaction(
      new TransactionMessage({
        payerKey: payer,
        recentBlockhash: BLOCKHASH,
        instructions: [transferTo(payer, user)],
      }).compileToV0Message(),
    )
    expect(isRequiredSigner(tx, user)).toBe(false)
  })

  it('is true for a legacy tx the wallet signs but does not pay', () => {
    expect(isRequiredSigner(legacyTx(payer, user), user)).toBe(true)
  })

  it('is false for a legacy tx without the wallet', () => {
    expect(isRequiredSigner(legacyTx(payer), user)).toBe(false)
  })

  it('is true for legacy bytes the wallet signs but does not pay', () => {
    expect(isRequiredSigner(asBrowserBytes(legacyTx(payer, user)), user)).toBe(
      true,
    )
  })

  it('is false for legacy bytes that only credit the wallet', () => {
    const tx = new Transaction({ feePayer: payer, recentBlockhash: BLOCKHASH })
    tx.add(transferTo(payer, user))
    expect(isRequiredSigner(asBrowserBytes(tx), user)).toBe(false)
  })
})

describe('verifyEd25519', () => {
  it('returns false for a malformed signature', () => {
    const user = Keypair.generate()
    expect(
      verifyEd25519(
        new Uint8Array(10),
        new Uint8Array([1, 2, 3]),
        user.publicKey.toBytes(),
      ),
    ).toBe(false)
  })
})

const ledgerAccount = {
  ledgerDevice: { id: 'ledger', name: 'Nano X', type: 'bluetooth' as const },
  accountIndex: 0,
}
const keystoneAccount = {
  keystoneDevice: { masterFingerprint: 'fp', device: 'keystone' },
}

// Signs the message bytes the way a hardware device does
const deviceSign = (key: Keypair) => async (message: Buffer) =>
  Buffer.from(await signMessageEd25519(message, key.secretKey))

const signers = (overrides: Partial<Parameters<typeof signAsAccount>[3]>) => ({
  loadKeypair: jest.fn(async () => undefined),
  onMissingKeypair: jest.fn(async () => {
    throw new Error('missing key')
  }),
  signWithKeystone: jest.fn(async () => undefined),
  signWithLedger: jest.fn(async () => undefined),
  signMessageWithKeystone: jest.fn(async () => undefined),
  signMessageWithLedger: jest.fn(async () => undefined),
  ...overrides,
})

describe('signAsAccount', () => {
  it('signs with the loaded key when the cached key matches', async () => {
    const user = Keypair.generate()
    const s = signers({ cachedKeypair: user })
    const tx = await signAsAccount(
      versionedTx(user.publicKey),
      {},
      user.publicKey,
      s,
    )
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
    expect(s.loadKeypair).not.toHaveBeenCalled()
  })

  it('reloads the key when the cached key is for another account', async () => {
    const user = Keypair.generate()
    const s = signers({
      cachedKeypair: Keypair.generate(),
      loadKeypair: jest.fn(async () => user),
    })
    const tx = await signAsAccount(
      legacyTx(user.publicKey),
      {},
      user.publicKey,
      s,
    )
    expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
  })

  it('reports a missing key instead of returning an unsigned tx', async () => {
    const user = Keypair.generate()
    const s = signers({})
    await expect(
      signAsAccount(versionedTx(user.publicKey), {}, user.publicKey, s),
    ).rejects.toThrow('missing key')
    expect(s.onMissingKeypair).toHaveBeenCalled()
  })

  it('throws when the stored key belongs to another account', async () => {
    const user = Keypair.generate()
    const s = signers({ loadKeypair: jest.fn(async () => Keypair.generate()) })
    await expect(
      signAsAccount(versionedTx(user.publicKey), {}, user.publicKey, s),
    ).rejects.toThrow(/does not match/)
  })

  it('takes the software path for a ledger without an account index', async () => {
    const user = Keypair.generate()
    const s = signers({ loadKeypair: jest.fn(async () => user) })
    await signAsAccount(
      versionedTx(user.publicKey),
      { ...ledgerAccount, accountIndex: undefined },
      user.publicKey,
      s,
    )
    expect(s.signWithLedger).not.toHaveBeenCalled()
  })

  it.each([
    ['ledger', ledgerAccount, 'signWithLedger'],
    ['keystone', keystoneAccount, 'signWithKeystone'],
  ] as const)(
    'accepts a %s signature by the user',
    async (_, account, device) => {
      const user = Keypair.generate()
      const s = signers({ [device]: jest.fn(deviceSign(user)) })
      const tx = await signAsAccount(
        versionedTx(user.publicKey),
        account,
        user.publicKey,
        s,
      )
      expect(() => assertSignedBy(tx, user.publicKey)).not.toThrow()
      expect(s.loadKeypair).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['ledger', ledgerAccount, 'signWithLedger'],
    ['keystone', keystoneAccount, 'signWithKeystone'],
  ] as const)(
    'rejects a %s signature by another key',
    async (_, account, device) => {
      const user = Keypair.generate()
      const s = signers({ [device]: jest.fn(deviceSign(Keypair.generate())) })
      await expect(
        signAsAccount(versionedTx(user.publicKey), account, user.publicKey, s),
      ).rejects.toThrow(/not signed/)
    },
  )

  it.each([
    ['ledger', ledgerAccount, 'signWithLedger', undefined],
    ['keystone', keystoneAccount, 'signWithKeystone', Buffer.alloc(0)],
  ] as const)(
    'throws when the %s returns no signature',
    async (_, account, device, sig) => {
      const user = Keypair.generate()
      const s = signers({ [device]: jest.fn(async () => sig) })
      await expect(
        signAsAccount(versionedTx(user.publicKey), account, user.publicKey, s),
      ).rejects.toThrow(/not signed/)
    },
  )
})

describe('signMessageAsAccount', () => {
  const message = Buffer.from('hello')

  it('signs with the software key so the signature verifies', async () => {
    const user = Keypair.generate()
    const s = signers({ cachedKeypair: user })
    const signature = await signMessageAsAccount(message, {}, user.publicKey, s)
    expect(verifyEd25519(signature, message, user.publicKey.toBytes())).toBe(
      true,
    )
  })

  it('throws when the stored key belongs to another account', async () => {
    const user = Keypair.generate()
    const s = signers({ loadKeypair: jest.fn(async () => Keypair.generate()) })
    await expect(
      signMessageAsAccount(message, {}, user.publicKey, s),
    ).rejects.toThrow(/does not match/)
  })

  it('reports a missing software key', async () => {
    const user = Keypair.generate()
    const s = signers({})
    await expect(
      signMessageAsAccount(message, {}, user.publicKey, s),
    ).rejects.toThrow('missing key')
    expect(s.onMissingKeypair).toHaveBeenCalled()
    expect(s.signMessageWithLedger).not.toHaveBeenCalled()
  })

  it('signs on the ledger for an account at index 0', async () => {
    const user = Keypair.generate()
    const s = signers({
      cachedKeypair: user,
      signMessageWithLedger: jest.fn(deviceSign(user)),
    })
    await signMessageAsAccount(message, ledgerAccount, user.publicKey, s)
    expect(s.signMessageWithLedger).toHaveBeenCalledWith(message)
    expect(s.loadKeypair).not.toHaveBeenCalled()
  })

  it('signs on the keystone for a keystone account', async () => {
    const user = Keypair.generate()
    const s = signers({ signMessageWithKeystone: jest.fn(deviceSign(user)) })
    await signMessageAsAccount(message, keystoneAccount, user.publicKey, s)
    expect(s.signMessageWithKeystone).toHaveBeenCalledWith(message)
    expect(s.signMessageWithLedger).not.toHaveBeenCalled()
  })

  it('throws when the device returns no signature', async () => {
    const user = Keypair.generate()
    const s = signers({})
    await expect(
      signMessageAsAccount(message, keystoneAccount, user.publicKey, s),
    ).rejects.toThrow(/not signed/)
  })

  it.each([
    ['legacy', (k: PublicKey) => legacyTx(k).serializeMessage()],
    ['v0', (k: PublicKey) => Buffer.from(versionedTx(k).message.serialize())],
  ] as const)(
    'refuses a %s transaction message without calling a signer',
    async (_, txMessage) => {
      const user = Keypair.generate()
      const s = signers({ cachedKeypair: user })
      await expect(
        signMessageAsAccount(txMessage(user.publicKey), {}, user.publicKey, s),
      ).rejects.toThrow(/transaction as a message/)
      expect(s.loadKeypair).not.toHaveBeenCalled()
      expect(s.onMissingKeypair).not.toHaveBeenCalled()
      expect(s.signMessageWithKeystone).not.toHaveBeenCalled()
      expect(s.signMessageWithLedger).not.toHaveBeenCalled()
    },
  )

  it('refuses a transaction message on a ledger before the device signs', async () => {
    const user = Keypair.generate()
    const s = signers({ signMessageWithLedger: jest.fn(deviceSign(user)) })
    await expect(
      signMessageAsAccount(
        legacyTx(user.publicKey).serializeMessage(),
        ledgerAccount,
        user.publicKey,
        s,
      ),
    ).rejects.toThrow(/transaction as a message/)
    expect(s.signMessageWithLedger).not.toHaveBeenCalled()
  })

  it('signs a transaction message with a trailing byte', async () => {
    const user = Keypair.generate()
    const s = signers({ cachedKeypair: user })
    const padded = Buffer.concat([
      legacyTx(user.publicKey).serializeMessage(),
      Buffer.from([0]),
    ])
    const signature = await signMessageAsAccount(padded, {}, user.publicKey, s)
    expect(verifyEd25519(signature, padded, user.publicKey.toBytes())).toBe(
      true,
    )
  })

  it('signs a sign-in-with-solana text message', async () => {
    const user = Keypair.generate()
    const s = signers({ cachedKeypair: user })
    const siws = Buffer.from(
      `example.com wants you to sign in with your Solana account:\n${user.publicKey.toBase58()}\n\nSign in to Example\n\nURI: https://example.com\nVersion: 1\nChain: mainnet\nNonce: 32891756\nIssued At: 2026-10-14T00:00:00.000Z`,
    )
    const signature = await signMessageAsAccount(siws, {}, user.publicKey, s)
    expect(verifyEd25519(signature, siws, user.publicKey.toBytes())).toBe(true)
  })
})
