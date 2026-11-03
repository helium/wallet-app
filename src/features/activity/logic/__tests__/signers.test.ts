import { EnrichedTransaction } from '../../../../types/solana'
import { attachSigners } from '../signers'
import enhanced from './fixtures/v0.json'
import parsedEvents from './fixtures/v1.json'

// /v1 answers in request order, so its signatures are the request order.
const requestOrder = parsedEvents.map((item) => item.signature)

describe('attachSigners', () => {
  it('gives each transaction its own signers when the response order differs from the request', () => {
    const response = enhanced as unknown as EnrichedTransaction[]
    expect(response.map((tx) => tx.signature)).not.toEqual(requestOrder)

    const signed = attachSigners(
      response,
      requestOrder.map((signature) => ({
        signature,
        signers: [`signer-of-${signature}`],
      })),
    )

    signed.forEach((tx) => {
      expect(tx.signers).toEqual([`signer-of-${tx.signature}`])
    })
  })

  it('gives no signers to a transaction the signature list does not have', () => {
    const response = enhanced as unknown as EnrichedTransaction[]

    const [signed] = attachSigners(response.slice(0, 1), [])

    expect(signed.signers).toEqual([])
  })
})
