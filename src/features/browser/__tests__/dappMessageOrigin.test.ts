import { senderOrigin } from '../dappMessageOrigin'

describe('senderOrigin', () => {
  it('attributes a message to the origin of its sender, without path or query', () => {
    expect(senderOrigin('https://app.example/swap?x=1#y')).toBe(
      'https://app.example',
    )
  })

  it('attributes an Android message, which carries only the frame origin', () => {
    expect(senderOrigin('https://app.example')).toBe('https://app.example')
  })

  it('attributes an iframe message to the iframe, not the top page', () => {
    expect(senderOrigin('https://ads.example/frame')).toBe(
      'https://ads.example',
    )
  })

  it('keeps the scheme and a non-default port in the origin', () => {
    expect(senderOrigin('http://app.example/')).toBe('http://app.example')
    expect(senderOrigin('https://app.example:8443/')).toBe(
      'https://app.example:8443',
    )
  })

  it('rejects a sender with an opaque origin', () => {
    expect(senderOrigin('about:blank')).toBeUndefined()
    expect(senderOrigin('about:srcdoc')).toBeUndefined()
    expect(senderOrigin('data:text/html,hi')).toBeUndefined()
    expect(senderOrigin('null')).toBeUndefined()
  })

  it('rejects a sender without a parseable url', () => {
    expect(senderOrigin('')).toBeUndefined()
    expect(senderOrigin(undefined)).toBeUndefined()
  })
})
