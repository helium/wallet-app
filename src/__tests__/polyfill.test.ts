// Hermes ships a native structuredClone. When one is present at load,
// @ungap/structured-clone exports a wrapper that calls the global
// structuredClone, so the polyfill must not put that wrapper on the global.
const nativeStructuredClone = global.structuredClone
const nativeSubarray = Buffer.prototype.subarray

const loadPolyfill = () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../polyfill')
  })
}

afterEach(() => {
  global.structuredClone = nativeStructuredClone
  Buffer.prototype.subarray = nativeSubarray
})

describe('polyfill structuredClone', () => {
  it('keeps the native structuredClone when the runtime has one', () => {
    loadPolyfill()

    const source = { a: 1, nested: { b: [2, 3] } }
    const clone = global.structuredClone(source)

    expect(global.structuredClone).toBe(nativeStructuredClone)
    expect(clone).toEqual(source)
    expect(clone.nested).not.toBe(source.nested)
  })

  it('installs a working structuredClone when the runtime has none', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).structuredClone
    loadPolyfill()

    const source = { a: 1, nested: { b: [2, 3] } }
    const clone = global.structuredClone(source)

    expect(typeof global.structuredClone).toBe('function')
    expect(clone).toEqual(source)
    expect(clone.nested).not.toBe(source.nested)
  })
})
