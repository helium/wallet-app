import KeystoneSDK, {
  SolSignature,
  UR,
  URDecoder,
} from '@keystonehq/keystone-sdk'

export type ScanResult =
  | { status: 'progress'; progress: number }
  | { status: 'complete'; signature: SolSignature }
  | { status: 'error'; error: unknown }

// A completed URDecoder ignores further parts and keeps returning its first
// result, so the decoder must be replaced after every completion or failure.
// Otherwise a second sign request in the same app session replays the first
// signature.
export const createSignatureScanner = (sdk: KeystoneSDK) => {
  let decoder = new URDecoder()
  const reset = () => {
    decoder = new URDecoder()
  }
  const receive = (qrString: string, expectedRequestId: string): ScanResult => {
    try {
      decoder.receivePart(qrString.toLowerCase())
      if (decoder.isError()) {
        throw new Error(decoder.resultError())
      }
      if (!decoder.isComplete()) {
        return {
          status: 'progress',
          progress: Math.round(decoder.getProgress() * 100),
        }
      }
      const ur = decoder.resultUR()
      reset()
      const signature = sdk.sol.parseSignature(new UR(ur.cbor, ur.type))
      if (signature.requestId !== expectedRequestId) {
        throw new Error(
          `Signature is for request ${signature.requestId}, expected ${expectedRequestId}`,
        )
      }
      return { status: 'complete', signature }
    } catch (error) {
      reset()
      return { status: 'error', error }
    }
  }
  return { receive, reset }
}
