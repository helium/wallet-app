import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { assertSignedBy, signAsAccount, signWithKeypair } from '../signing'
import { signMessageEd25519, verifyEd25519 } from '../../utils/crypto'

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
