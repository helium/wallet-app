import { UnconfirmedSubmitError } from '../../../utils/unconfirmedSubmitError'
import { swapError } from '../swapError'

describe('swapError', () => {
  it('keeps an unconfirmed submit as is', () => {
    const unconfirmed = new UnconfirmedSubmitError(
      new TypeError('Network request failed'),
    )

    expect(swapError('IOT', unconfirmed)).toBe(unconfirmed)
  })

  it('names the token in any other failure', () => {
    const error = swapError('MOBILE', new Error('No route'))

    expect(error).not.toBeInstanceOf(UnconfirmedSubmitError)
    expect(error.message).toBe('Failed to swap MOBILE: No route')
  })
})
