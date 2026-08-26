/**
 * Device-less verification of the Keystone Solana sign path used by
 * SignTxModal: generateSignRequest -> multi-part UR frames -> decode back to
 * the same tx bytes, and parseSignature on a synthetic sol-signature UR.
 */
import KeystoneSDK, {
  KeystoneSolanaSDK,
  UR,
  URDecoder,
} from '@keystonehq/keystone-sdk'
import { uuid } from '@keystonehq/keystone-sdk/dist/utils'
// Transitive deps of @keystonehq/keystone-sdk; used here to decode what the
// device would receive.
/* eslint-disable import/no-extraneous-dependencies */
import {
  SolSignRequest,
  SolSignature,
  SignType,
} from '@keystonehq/bc-ur-registry-sol'
/* eslint-enable import/no-extraneous-dependencies */
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { KeystoneSolSignRequest } from '../types/keystoneSolanaTxType'
import { urToFrames } from './urFrames'

const PATH = "m/44'/501'/0'/0'"
const XFP = '12345678'

const from = Keypair.generate()
const to = Keypair.generate().publicKey
const blockhash = new PublicKey(Keypair.generate().publicKey).toBase58()

const legacyTxBytes = () => {
  const tx = new Transaction({
    feePayer: from.publicKey,
    recentBlockhash: blockhash,
  }).add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: 1,
    }),
  )
  return tx.serialize({ requireAllSignatures: false })
}

const versionedTxBytes = () => {
  const msg = new TransactionMessage({
    payerKey: from.publicKey,
    recentBlockhash: blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: 1,
      }),
    ],
  }).compileToV0Message()
  return Buffer.from(new VersionedTransaction(msg).serialize())
}

// Mirrors KeystoneModal.showKeystoneModal
const buildRequest = (
  transaction: Buffer,
  dataType = KeystoneSolanaSDK.DataType.Transaction,
): KeystoneSolSignRequest => ({
  requestId: uuid.v4(),
  signData: transaction.toString('hex'),
  dataType,
  path: PATH,
  xfp: XFP,
  origin: 'Helium',
})

// Mirrors AnimatedQrCode (encode) + SignTxModal.handleBarCodeScanned (decode)
const roundTripThroughFrames = (ur: UR) => {
  const frames = urToFrames(ur)
  const decoder = new URDecoder()
  frames.forEach((f) => decoder.receivePart(f.toLowerCase()))
  expect(decoder.isComplete()).toBe(true)
  const result = decoder.resultUR()
  return { frames, result }
}

describe('Keystone sol-sign-request', () => {
  const sdk = new KeystoneSDK()

  test.each([
    ['legacy', legacyTxBytes],
    ['versioned', versionedTxBytes],
  ])('%s tx round-trips through multi-part UR frames', (_name, mk) => {
    const txBytes = mk()
    const req = buildRequest(txBytes)
    const ur = sdk.sol.generateSignRequest(req)

    expect(ur.type).toBe('sol-sign-request')

    const { frames, result } = roundTripThroughFrames(ur)
    expect(frames.length).toBeGreaterThan(1)
    expect(result.type).toBe('sol-sign-request')

    const decoded = SolSignRequest.fromCBOR(result.cbor)
    expect(decoded.getSignData().equals(txBytes)).toBe(true)
    expect(decoded.getSignType()).toBe(SignType.Transaction)
    // CryptoKeypath drops the "m/" prefix; this is the registry's format
    expect(decoded.getDerivationPath()).toBe(PATH.replace(/^m\//, ''))
    expect(decoded.getOrigin()).toBe('Helium')
    expect(uuid.stringify(decoded.getRequestId() as Buffer)).toBe(req.requestId)
  })

  test('message sign request round-trips with SignType.Message', () => {
    const msgBytes = Buffer.from('Helium governance vote', 'utf8')
    const req = buildRequest(msgBytes, KeystoneSolanaSDK.DataType.Message)
    const ur = sdk.sol.generateSignRequest(req)
    const { result } = roundTripThroughFrames(ur)
    const decoded = SolSignRequest.fromCBOR(result.cbor)
    expect(decoded.getSignData().equals(msgBytes)).toBe(true)
    expect(decoded.getSignType()).toBe(SignType.Message)
  })

  test('DataType.Transaction is SignType.Transaction (1)', () => {
    expect(KeystoneSolanaSDK.DataType.Transaction).toBe(1)
    expect(KeystoneSolanaSDK.DataType.Message).toBe(2)
  })

  test('generateSignRequest throws on an empty requestId (guard in SignTxModal)', () => {
    const req = { ...buildRequest(legacyTxBytes()), requestId: '' }
    expect(() => sdk.sol.generateSignRequest(req)).toThrow()
  })
})

describe('Keystone sol-signature', () => {
  const sdk = new KeystoneSDK()

  test('parseSignature accepts a synthetic sol-signature UR via the scanner path', () => {
    const requestId = uuid.v4()
    const sig = Buffer.alloc(64, 7)
    const sigUr = new SolSignature(
      sig,
      Buffer.from(uuid.parse(requestId) as Uint8Array),
    ).toUR()
    expect(sigUr.type).toBe('sol-signature')

    // Device emits frames; app scans them
    const { result } = roundTripThroughFrames(new UR(sigUr.cbor, sigUr.type))

    const parsed = sdk.sol.parseSignature(new UR(result.cbor, result.type))

    expect(parsed.requestId).toBe(requestId)
    expect(parsed.signature).toBe(sig.toString('hex'))
    expect(Buffer.from(parsed.signature, 'hex').equals(sig)).toBe(true)
  })

  test('parseSignature rejects a UR of the wrong type', () => {
    const ur = sdk.sol.generateSignRequest(buildRequest(legacyTxBytes()))
    expect(() => sdk.sol.parseSignature(ur)).toThrow('type not match')
  })
})

describe('Buffer global at bc-ur-registry load time', () => {
  // Requires the registry (and cbor-sync) fresh, then the sol registry on top
  // of it, and returns a thunk that encodes a minimal sign request.
  const loadAndBuild = () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-extraneous-dependencies
    const sol = require('@keystonehq/bc-ur-registry-sol')
    return () =>
      sol.SolSignRequest.constructSOLRequest(
        Buffer.from('0102', 'hex'),
        PATH,
        XFP,
        sol.SignType.Transaction,
        '0c8c2c7e-3b3a-4c8f-9a8c-2f1c3e4d5a6b',
      ).toUR()
  }

  test('present: encodes', () => {
    jest.isolateModules(() => {
      expect(loadAndBuild()().type).toBe('sol-sign-request')
    })
  })

  test('absent at load, present at call: "Unsupported output format: undefined"', () => {
    const saved = global.Buffer
    try {
      jest.isolateModules(() => {
        // @ts-expect-error simulate a runtime without the Buffer global
        delete global.Buffer
        // cbor-sync registers its Buffer writer only if Buffer is a function
        // when the module body runs.
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-extraneous-dependencies
        require('@keystonehq/bc-ur-registry')
        global.Buffer = saved
        expect(loadAndBuild()).toThrow('Unsupported output format: undefined')
      })
    } finally {
      global.Buffer = saved
    }
  })

  test('keystone-sdk itself cannot even load without Buffer', () => {
    const saved = global.Buffer
    try {
      jest.isolateModules(() => {
        // @ts-expect-error simulate a runtime without the Buffer global
        delete global.Buffer
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        expect(() => require('@keystonehq/keystone-sdk')).toThrow(
          'Buffer is not defined',
        )
      })
    } finally {
      global.Buffer = saved
    }
  })
})
