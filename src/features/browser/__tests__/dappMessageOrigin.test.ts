import { isSameOrigin } from '../dappMessageOrigin'

describe('isSameOrigin', () => {
  it('accepts a top-frame message from another path of the top page', () => {
    expect(
      isSameOrigin('https://app.example/swap?x=1', 'https://app.example/'),
    ).toBe(true)
  })

  it('accepts an Android message, which carries only the frame origin', () => {
    expect(
      isSameOrigin('https://app.example', 'https://app.example/swap'),
    ).toBe(true)
  })

  it('rejects a message from an iframe on another host', () => {
    expect(
      isSameOrigin('https://ads.example/frame', 'https://app.example/'),
    ).toBe(false)
  })

  it('rejects a message from the same host on another scheme', () => {
    expect(isSameOrigin('http://app.example/', 'https://app.example/')).toBe(
      false,
    )
  })

  it('rejects a message from the same host on another port', () => {
    expect(
      isSameOrigin('https://app.example:8443/', 'https://app.example/'),
    ).toBe(false)
  })

  it('rejects a message from a frame with an opaque origin', () => {
    expect(isSameOrigin('about:blank', 'https://app.example/')).toBe(false)
    expect(isSameOrigin('about:srcdoc', 'https://app.example/')).toBe(false)
    expect(isSameOrigin('null', 'https://app.example/')).toBe(false)
  })

  it('rejects a message without a parseable url', () => {
    expect(isSameOrigin('', 'https://app.example/')).toBe(false)
    expect(isSameOrigin(undefined, 'https://app.example/')).toBe(false)
  })

  it('rejects every message while the top page has no origin', () => {
    expect(isSameOrigin('about:blank', 'about:blank')).toBe(false)
    expect(isSameOrigin('null', 'null')).toBe(false)
    expect(isSameOrigin(undefined, '')).toBe(false)
  })
})
