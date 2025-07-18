import { xsalsa20poly1305 } from '@noble/ciphers/salsa'
import * as ed25519 from '@noble/ed25519'
import { argon2id } from '@noble/hashes/argon2'
import { sha512 } from '@noble/hashes/sha2'
import { Buffer } from 'buffer'

ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m))

/**
 * Libsodium-compatible Argon2ID parameters
 * Equivalent to sodium's OPSLIMIT_MODERATE and MEMLIMIT_MODERATE
 */
export const ARGON2ID_MODERATE_PARAMS = {
  t: 3, // OPSLIMIT_MODERATE equivalent (iterations)
  m: 67108864, // MEMLIMIT_MODERATE equivalent (64MB memory)
  p: 1, // parallelism
  dkLen: 32, // derived key length
} as const

/**
 * Derives a key from password and salt using Argon2ID with libsodium-compatible parameters
 * @param password Password string or buffer
 * @param salt Salt as base64 string or buffer
 * @returns 32-byte derived key
 */
export function deriveKeyFromPassword(
  password: string | Buffer | Uint8Array,
  salt: string | Buffer | Uint8Array,
): Uint8Array {
  const passwordBytes =
    typeof password === 'string'
      ? new Uint8Array(Buffer.from(password))
      : password instanceof Buffer
      ? new Uint8Array(password)
      : password

  const saltBytes =
    typeof salt === 'string'
      ? new Uint8Array(Buffer.from(salt, 'base64'))
      : salt instanceof Buffer
      ? new Uint8Array(salt)
      : salt

  return argon2id(passwordBytes, saltBytes, ARGON2ID_MODERATE_PARAMS)
}

/**
 * Decrypts data using XSalsa20-Poly1305 (libsodium secretbox compatible)
 * @param ciphertext Encrypted data as base64 string or buffer
 * @param nonce Nonce as base64 string or buffer
 * @param key 32-byte encryption key
 * @returns Decrypted data
 */
export function decryptSecretBox(
  ciphertext: string | Buffer | Uint8Array,
  nonce: string | Buffer | Uint8Array,
  key: Uint8Array,
): Uint8Array {
  const cipherBytes =
    typeof ciphertext === 'string'
      ? new Uint8Array(Buffer.from(ciphertext, 'base64'))
      : ciphertext instanceof Buffer
      ? new Uint8Array(ciphertext)
      : ciphertext

  const nonceBytes =
    typeof nonce === 'string'
      ? new Uint8Array(Buffer.from(nonce, 'base64'))
      : nonce instanceof Buffer
      ? new Uint8Array(nonce)
      : nonce

  const cipher = xsalsa20poly1305(key, nonceBytes)
  return cipher.decrypt(cipherBytes)
}

/**
 * Extracts the 32-byte seed from an Ed25519 secret key
 * Ed25519 secret keys are 64 bytes, with the seed being the first 32 bytes
 * @param secretKey 64-byte Ed25519 secret key
 * @returns 32-byte seed
 */
export function extractEd25519Seed(secretKey: Uint8Array | Buffer): Uint8Array {
  const keyBytes =
    secretKey instanceof Buffer ? new Uint8Array(secretKey) : secretKey

  if (keyBytes.length !== 64) {
    throw new Error(
      `Invalid Ed25519 secret key length: expected 64 bytes, got ${keyBytes.length}`,
    )
  }

  return keyBytes.slice(0, 32)
}

/**
 * Signs a message using Ed25519 (tweetnacl.sign.detached compatible)
 * @param message Message to sign as Buffer or Uint8Array
 * @param secretKey 64-byte Ed25519 secret key (as used by tweetnacl)
 * @returns 64-byte signature
 */
export async function signMessageEd25519(
  message: Buffer | Uint8Array,
  secretKey: Uint8Array,
): Promise<Uint8Array> {
  const messageBytes =
    message instanceof Buffer ? new Uint8Array(message) : message
  const seed = extractEd25519Seed(secretKey)

  return ed25519.sign(messageBytes, seed)
}

/**
 * Decrypts a password-protected seed phrase or private key
 * This combines Argon2ID key derivation with XSalsa20-Poly1305 decryption
 * @param encryptedData Object containing ciphertext, nonce, and salt (all base64)
 * @param password Password string
 * @returns Decrypted data as string
 */
export function decryptPasswordProtectedData(
  encryptedData: {
    ciphertext: string
    nonce: string
    salt: string
  },
  password: string,
): string {
  const key = deriveKeyFromPassword(password, encryptedData.salt)
  const decryptedBytes = decryptSecretBox(
    encryptedData.ciphertext,
    encryptedData.nonce,
    key,
  )
  return Buffer.from(decryptedBytes).toString()
}
