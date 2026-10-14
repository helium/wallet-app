import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import type { CSAccount } from '../storage/cloudStorage'
import { verifyEd25519 } from '../utils/crypto'

// Local copy of solanaUtils.isVersionedTransaction: solanaUtils pulls in RN-only modules that jest cannot load
const isVersioned = (
  tx: Transaction | VersionedTransaction,
): tx is VersionedTransaction => 'version' in tx

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
}

// Signs with the account's wallet type (software, Keystone or Ledger), then
// checks that the signer's slot verifies.
export const signAsAccount = async <
  T extends Transaction | VersionedTransaction,
>(
  tx: T,
  account: Pick<CSAccount, 'ledgerDevice' | 'keystoneDevice' | 'accountIndex'>,
  signer: PublicKey,
  signers: AccountSigners,
): Promise<T> => {
  const message = () =>
    isVersioned(tx)
      ? Buffer.from(tx.message.serialize())
      : tx.serializeMessage()

  if (
    (!account.ledgerDevice?.id ||
      !account.ledgerDevice?.type ||
      account.accountIndex === undefined) &&
    !account.keystoneDevice
  ) {
    const keypair = signers.cachedKeypair?.publicKey.equals(signer)
      ? signers.cachedKeypair
      : await signers.loadKeypair()
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
