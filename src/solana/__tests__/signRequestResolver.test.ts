import { createSignRequestResolver } from '../signRequestResolver'

describe('createSignRequestResolver', () => {
  it('declines the pending request when a new one starts', async () => {
    const resolver = createSignRequestResolver()
    const first = resolver.next()
    const second = resolver.next()
    await expect(first).resolves.toBe(false)
    resolver.settle(true)
    await expect(second).resolves.toBe(true)
  })

  it('settles a request once', async () => {
    const resolver = createSignRequestResolver()
    const request = resolver.next()
    expect(resolver.settle(true)).toBe(true)
    expect(resolver.settle(false)).toBe(false)
    await expect(request).resolves.toBe(true)
  })
})
