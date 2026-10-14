import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
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
