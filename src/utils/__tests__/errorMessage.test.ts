import { errorMessage } from '../errorMessage'

describe('errorMessage', () => {
  it('gives the message of an Error', () => {
    expect(errorMessage(new Error('route failed'))).toBe('route failed')
  })

  it('gives a string as itself', () => {
    expect(errorMessage('route failed')).toBe('route failed')
  })
})
