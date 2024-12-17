import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { SendOptions } from '@solana/web3.js'
import { solAddressToHelium } from '@utils/accountUtils'
import { isEqual } from 'lodash'
import { useCallback } from 'react'
import tweetnacl from 'tweetnacl'
import * as LargeSecureStorage from '@config/storage/largeSecureStorage'

const APP_SESSIONS_KEY = 'appSessions'

// eslint-disable-next-line @typescript-eslint/naming-convention
type APP_SESSIONS = Record<string, string>

// eslint-disable-next-line @typescript-eslint/naming-convention
type APP_SESSION = {
  // shared secret key for the session
  secretKey: string
  session: string
  // public key that is connected to the session
  publicKey: string
}

export type Session = {
  app_url: string
  timestamp: string
  chain?: string
  cluster?: string
}

export type DisconnectPayload = {
  session: string
}

export type SignTransactionPayload = {
  transaction: string
  session: string // token received from connect-method
}

export type SignMessagePayload = {
  message: string
  session: string // token received from connect-method
  display?: 'utf8' | 'hex'
}

export type SignTransactionsPayload = {
  transactions: string[] // serialized transactions, bs58-encoded
  session: string // token received from connect-method
}

export type SignAndSendTransactionPayload = {
  transaction: string // serialized transaction, base58-encoded
  session: string // token received from connect-method
  sendOptions?: SendOptions // an optional Solana web3.js sendOptions object
}

const useSession = () => {
  const { accounts, setCurrentAccount } = useAccountStorage()

  const getSharedSecret = useCallback(
    async (dapp_encryption_public_key: string) => {
      const existingStorage = await LargeSecureStorage.getItem(APP_SESSIONS_KEY)
      let existingStorageParsed: APP_SESSIONS = {}

      if (existingStorage) {
        existingStorageParsed = JSON.parse(existingStorage)
      }

      if (!existingStorageParsed[dapp_encryption_public_key]) {
        throw new Error('Session not found')
      }

      const appSession: APP_SESSION = JSON.parse(
        existingStorageParsed[dapp_encryption_public_key],
      ) as APP_SESSION

      const sharedSecret = tweetnacl.box.before(
        bs58.decode(dapp_encryption_public_key),
        bs58.decode(appSession.secretKey),
      )

      return sharedSecret
    },
    [],
  )

  const encryptPayload = useCallback(
    (payload: string, sharedSecret?: Uint8Array) => {
      if (!sharedSecret) throw new Error('missing shared secret')

      const nonce = tweetnacl.randomBytes(24)

      const encryptedPayload = tweetnacl.box.after(
        Buffer.from(payload),
        nonce,
        sharedSecret,
      )

      return [nonce, encryptedPayload]
    },
    [],
  )

  const decryptPayload = useCallback(
    (data: string, nonce: string, sharedSecret?: Uint8Array) => {
      if (!sharedSecret) throw new Error('missing shared secret')

      const decryptedData = tweetnacl.box.open.after(
        bs58.decode(data),
        bs58.decode(nonce),
        sharedSecret,
      )
      if (!decryptedData) {
        throw new Error('Unable to decrypt data')
      }
      return JSON.parse(Buffer.from(decryptedData).toString('utf8'))
    },
    [],
  )

  const connect = useCallback(
    async (
      userPublicKey: string,
      dapp_encryption_public_key: string,
      session: Session,
    ) => {
      if (!dapp_encryption_public_key) return
      if (!session?.app_url || !session?.timestamp) return

      const { publicKey: heliumEncryptionPublicKey, secretKey } =
        tweetnacl.box.keyPair()

      const sharedSecret = tweetnacl.box.before(
        bs58.decode(dapp_encryption_public_key),
        secretKey,
      )

      const existingStorage = await LargeSecureStorage.getItem(APP_SESSIONS_KEY)
      let existingStorageParsed: APP_SESSIONS = {}

      if (existingStorage) {
        existingStorageParsed = JSON.parse(existingStorage)
      }

      existingStorageParsed[dapp_encryption_public_key] = JSON.stringify({
        secretKey: bs58.encode(secretKey),
        session: JSON.stringify(session),
        publicKey: userPublicKey,
      })

      await LargeSecureStorage.setItem(
        APP_SESSIONS_KEY,
        JSON.stringify(existingStorageParsed),
      )

      const [nonce, encryptedPayload] = encryptPayload(
        JSON.stringify({
          session: JSON.stringify(session),
          public_key: userPublicKey,
        }),
        sharedSecret,
      )

      return {
        helium_encryption_public_key: bs58.encode(heliumEncryptionPublicKey),
        nonce: bs58.encode(nonce),
        data: bs58.encode(encryptedPayload),
      }
    },
    [encryptPayload],
  )

  const disconnect = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      if (!dapp_encryption_public_key) return

      const existingStorage = await LargeSecureStorage.getItem(APP_SESSIONS_KEY)
      let existingStorageParsed: APP_SESSIONS = {}

      if (existingStorage) {
        existingStorageParsed = JSON.parse(existingStorage)
      }

      if (!existingStorageParsed[dapp_encryption_public_key]) return

      const appSession: APP_SESSION = JSON.parse(
        existingStorageParsed[dapp_encryption_public_key],
      ) as APP_SESSION

      const { secretKey, session: storedSession } = appSession

      const sharedSecret = tweetnacl.box.before(
        bs58.decode(dapp_encryption_public_key),
        bs58.decode(secretKey),
      )

      const { session } = decryptPayload(payload, nonce, sharedSecret)

      // check if session and storedSession objects are equal
      if (!isEqual(session, storedSession)) {
        throw new Error('Session is not valid')
      }

      delete existingStorageParsed[dapp_encryption_public_key]

      await LargeSecureStorage.setItem(
        APP_SESSIONS_KEY,
        JSON.stringify(existingStorageParsed),
      )
    },
    [decryptPayload],
  )

  const getSignPayload = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      if (!dapp_encryption_public_key || !accounts) return

      const existingStorage = await LargeSecureStorage.getItem(APP_SESSIONS_KEY)
      if (!existingStorage) {
        throw new Error('No sessions found')
      }

      const existingStorageParsed: APP_SESSIONS = JSON.parse(existingStorage)

      if (!existingStorageParsed[dapp_encryption_public_key]) {
        throw new Error('Session not found')
      }

      const {
        secretKey,
        session: storedSession,
        publicKey,
      } = JSON.parse(
        existingStorageParsed[dapp_encryption_public_key],
      ) as APP_SESSION

      const sharedSecret = tweetnacl.box.before(
        bs58.decode(dapp_encryption_public_key),
        bs58.decode(secretKey),
      )

      const payloadData = decryptPayload(payload, nonce, sharedSecret)

      const { session } = payloadData

      if (!isEqual(session, storedSession)) {
        throw new Error('Session is not valid')
      }

      const account = accounts[solAddressToHelium(publicKey)]

      if (!account) {
        throw new Error('Account not found please reconnect')
      }

      setCurrentAccount(account)

      return payloadData
    },
    [accounts, setCurrentAccount, decryptPayload],
  )

  const signTransaction = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      const signTxnPayload: SignTransactionPayload = await getSignPayload(
        dapp_encryption_public_key,
        payload,
        nonce,
      )

      if (!signTxnPayload) {
        throw new Error('Sign transaction payload not found')
      }

      return signTxnPayload
    },
    [getSignPayload],
  )

  const signMessage = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      const signMessagePayload: string | undefined = await getSignPayload(
        dapp_encryption_public_key,
        payload,
        nonce,
      )

      if (!signMessagePayload) {
        throw new Error('Sign message payload not found')
      }

      const parsedPayload: SignMessagePayload = JSON.parse(signMessagePayload)

      return parsedPayload
    },
    [getSignPayload],
  )

  const signAllTransactions = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      const signTransactionsPayload: string | undefined = await getSignPayload(
        dapp_encryption_public_key,
        payload,
        nonce,
      )

      if (!signTransactionsPayload) {
        throw new Error('Sign transactions payload not found')
      }

      const parsedPayload: SignTransactionsPayload = JSON.parse(
        signTransactionsPayload,
      )

      return parsedPayload
    },
    [getSignPayload],
  )

  const signAndSendTransaction = useCallback(
    async (
      dapp_encryption_public_key: string,
      payload: string,
      nonce: string,
    ) => {
      const signAndSendTransactionPayload: string | undefined =
        await getSignPayload(dapp_encryption_public_key, payload, nonce)

      if (!signAndSendTransactionPayload) {
        throw new Error('Sign and send transaction payload not found')
      }

      const parsedPayload: SignAndSendTransactionPayload = JSON.parse(
        signAndSendTransactionPayload,
      )

      return parsedPayload
    },
    [getSignPayload],
  )

  return {
    connect,
    disconnect,
    getSignPayload,
    signTransaction,
    signMessage,
    signAllTransactions,
    signAndSendTransaction,
    getSharedSecret,
    encryptPayload,
    decryptPayload,
  }
}

export default useSession
