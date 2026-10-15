import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import type { CSAccount } from '../storage/cloudStorage'
import { signMessageEd25519, verifyEd25519 } from '../utils/crypto'

// Local copy of solanaUtils.isVersionedTransaction: solanaUtils pulls in RN-only modules that jest cannot load
const isVersioned = (
  tx: Transaction | VersionedTransaction,
): tx is VersionedTransaction => 'version' in tx

// True when the pubkey must sign the tx: it is the fee payer or a signer
export const isRequiredSigner = (
  tx: Transaction | VersionedTransaction,
  pubkey: PublicKey,
): boolean => {
  if (isVersioned(tx)) {
    const { staticAccountKeys, header } = tx.message
    return staticAccountKeys
      .slice(0, header.numRequiredSignatures)
      .some((k) => k.equals(pubkey))
  }
  if (tx.feePayer?.equals(pubkey)) return true
  return tx.instructions.some((ix) =>
    ix.keys.some((k) => k.isSigner && k.pubkey.equals(pubkey)),
  )
}

// Signs with a software keypair. Refuses a key for another account, which
// would otherwise produce a tx the network rejects.
export const signWithKeypair = <T extends Transaction | VersionedTransaction>(
  tx: T,
  signer: PublicKey,
  keypair: Keypair,
): T => {
  if (!keypair.publicKey.equals(signer)) {
    throw new Error('Private key does not match the selected wallet')
  }
  if (isVersioned(tx)) {
    tx.sign([keypair])
  } else {
    tx.partialSign(keypair)
  }
  return tx
}

// Throws unless the signer's slot holds a valid signature over the message.
export const assertSignedBy = (
  tx: Transaction | VersionedTransaction,
  signer: PublicKey,
) => {
  let signature: Uint8Array | null | undefined
  let message: Uint8Array
  if (isVersioned(tx)) {
    const index = tx.message.staticAccountKeys.findIndex((k) =>
      k.equals(signer),
    )
    signature = tx.signatures[index]
    message = tx.message.serialize()
  } else {
    signature = tx.signatures.find((s) => s.publicKey.equals(signer))?.signature
    message = tx.serializeMessage()
  }
  if (!signature || !verifyEd25519(signature, message, signer.toBytes())) {
    throw new Error(`Transaction is not signed by ${signer.toBase58()}`)
  }
}

export type AccountSigners = {
  // Keypair loaded ahead of time; it can be unset or stale after an account switch
  cachedKeypair?: Keypair
  loadKeypair: () => Promise<Keypair | undefined>
  onMissingKeypair: () => Promise<never>
  signWithKeystone: (message: Buffer) => Promise<Buffer | undefined>
  signWithLedger: (message: Buffer) => Promise<Buffer | undefined>
  signMessageWithKeystone: (message: Buffer) => Promise<Buffer | undefined>
  signMessageWithLedger: (message: Buffer) => Promise<Buffer | undefined>
}

type SigningAccount = Pick<
  CSAccount,
  'ledgerDevice' | 'keystoneDevice' | 'accountIndex'
>

// True when the account signs with a software key rather than a device
const isSoftwareAccount = (account: SigningAccount) =>
  (!account.ledgerDevice?.id ||
    !account.ledgerDevice?.type ||
    account.accountIndex === undefined) &&
  !account.keystoneDevice

// The account's software key: the cached one when it matches, else reloaded
const accountKeypair = async (signer: PublicKey, signers: AccountSigners) =>
  signers.cachedKeypair?.publicKey.equals(signer)
    ? signers.cachedKeypair
    : signers.loadKeypair()

// Signs with the account's wallet type (software, Keystone or Ledger), then
// checks that the signer's slot verifies.
export const signAsAccount = async <
  T extends Transaction | VersionedTransaction,
>(
  tx: T,
  account: SigningAccount,
  signer: PublicKey,
  signers: AccountSigners,
): Promise<T> => {
  const message = () =>
    isVersioned(tx)
      ? Buffer.from(tx.message.serialize())
      : tx.serializeMessage()

  if (isSoftwareAccount(account)) {
    const keypair = await accountKeypair(signer, signers)
    if (!keypair) return signers.onMissingKeypair()
    signWithKeypair(tx, signer, keypair)
  } else if (account.keystoneDevice) {
    const signature = await signers.signWithKeystone(message())
    if (!signature || signature.length === 0) {
      throw new Error('Transaction is not signed')
    }
    tx.addSignature(signer, signature)
  } else {
    const signature = await signers.signWithLedger(message())
    if (!signature) throw new Error('Transaction not signed')
    tx.addSignature(signer, signature)
  }

  assertSignedBy(tx, signer)
  return tx
}

// web3.js 1.99's V1_TRANSACTION_SIZE_LIMIT. Its typings are masked by the
// web3.js 1.77 ambient types that @helium/onboarding pulls in.
const MAX_TRANSACTION_SIZE = 4096

// True when the bytes decode as a transaction message and re-serialize to
// exactly the same bytes. A signature over them would authorize that
// transaction. The round trip rejects random payloads that only parse
// because deserialize ignores trailing bytes.
export const isTransactionMessage = (message: Uint8Array): boolean => {
  if (message.length > MAX_TRANSACTION_SIZE) return false
  try {
    const serialized = VersionedMessage.deserialize(message).serialize()
    return Buffer.from(serialized).equals(Buffer.from(message))
  } catch {
    return false
  }
}

// Signs a message with the account's wallet type (software, Keystone or
// Ledger). Refuses a transaction message and a software key for another
// account.
export const signMessageAsAccount = async (
  message: Buffer,
  account: SigningAccount,
  signer: PublicKey,
  signers: AccountSigners,
): Promise<Buffer> => {
  if (isTransactionMessage(message)) {
    throw new Error('Refusing to sign a transaction as a message')
  }
  let signature: Buffer | undefined
  if (isSoftwareAccount(account)) {
    const keypair = await accountKeypair(signer, signers)
    if (!keypair) return signers.onMissingKeypair()
    if (!keypair.publicKey.equals(signer)) {
      throw new Error('Private key does not match the selected wallet')
    }
    signature = Buffer.from(
      await signMessageEd25519(message, keypair.secretKey),
    )
  } else if (account.keystoneDevice) {
    signature = await signers.signMessageWithKeystone(message)
  } else {
    signature = await signers.signMessageWithLedger(message)
  }
  if (!signature || signature.length === 0) {
    throw new Error('Message not signed')
  }
  return signature
}
