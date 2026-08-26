/**
 * The scanner that SignTxModal feeds camera frames into. Uses the real
 * bc-ur decoder and keystone-sdk; no mocks.
 */
import KeystoneSDK, { UR } from '@keystonehq/keystone-sdk'
import { uuid } from '@keystonehq/keystone-sdk/dist/utils'
import { UREncoder } from '@ngraveio/bc-ur'
// eslint-disable-next-line import/no-extraneous-dependencies
import { SolSignature } from '@keystonehq/bc-ur-registry-sol'
import { createSignatureScanner } from '../SignTx/signatureScanner'
import { MAX_FRAGMENT_CAPACITY, urToFrames } from './urFrames'

const framesFor = (
  requestId: string,
  fill: number,
  fragmentCapacity = MAX_FRAGMENT_CAPACITY,
) => {
  const ur = new SolSignature(
    Buffer.alloc(64, fill),
    Buffer.from(uuid.parse(requestId) as Uint8Array),
  ).toUR()
  return urToFrames(new UR(ur.cbor, ur.type), fragmentCapacity)
}

const scanAll = (
  scanner: ReturnType<typeof createSignatureScanner>,
  requestId: string,
  frames: string[],
) => frames.map((f) => scanner.receive(f, requestId))

describe('createSignatureScanner', () => {
  const scanner = createSignatureScanner(new KeystoneSDK())

  test('decodes a complete signature for the expected request', () => {
    const requestId = uuid.v4()
    const results = scanAll(scanner, requestId, framesFor(requestId, 1))
    expect(results[results.length - 1]).toEqual({
      status: 'complete',
      signature: expect.objectContaining({
        requestId,
        signature: Buffer.alloc(64, 1).toString('hex'),
      }),
    })
  })

  test('a second request gets its own signature, not a replay of the first', () => {
    const first = uuid.v4()
    const second = uuid.v4()
    scanAll(scanner, first, framesFor(first, 1))

    const results = scanAll(scanner, second, framesFor(second, 2))
    expect(results[results.length - 1]).toEqual({
      status: 'complete',
      signature: expect.objectContaining({
        requestId: second,
        signature: Buffer.alloc(64, 2).toString('hex'),
      }),
    })
  })

  test('a signature for a different request is rejected', () => {
    const expected = uuid.v4()
    const other = uuid.v4()
    const results = scanAll(scanner, expected, framesFor(other, 3))
    expect(results[results.length - 1].status).toBe('error')
  })

  test('a non-UR QR string reports an error instead of throwing', () => {
    expect(() =>
      scanner.receive('https://example.com', uuid.v4()),
    ).not.toThrow()
    expect(scanner.receive('https://example.com', uuid.v4()).status).toBe(
      'error',
    )
  })

  test('a sol-sign-request UR (wrong type) reports an error', () => {
    const requestId = uuid.v4()
    const sdk = new KeystoneSDK()
    const ur = sdk.sol.generateSignRequest({
      requestId,
      signData: '0102',
      dataType: 1,
      path: "m/44'/501'/0'/0'",
      xfp: '12345678',
      origin: 'Helium',
    })
    const encoder = new UREncoder(ur, 10_000)
    expect(scanner.receive(encoder.nextPart(), requestId).status).toBe('error')
  })

  test('reports progress before completion and stays scannable after an error', () => {
    const requestId = uuid.v4()
    // A sol-signature fits one 200-byte frame; force multi-part
    const frames = framesFor(requestId, 4, 30)
    expect(frames.length).toBeGreaterThan(1)
    expect(scanner.receive('garbage', requestId).status).toBe('error')
    expect(scanner.receive(frames[0], requestId)).toEqual({
      status: 'progress',
      progress: expect.any(Number),
    })
    const results = scanAll(scanner, requestId, frames.slice(1))
    expect(results[results.length - 1].status).toBe('complete')
  })
})
