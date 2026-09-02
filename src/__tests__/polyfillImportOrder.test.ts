import fs from 'fs'
import path from 'path'

// cbor-sync registers its Buffer reader/writer once at module load, guarded by
// `typeof Buffer`. If any import in the app tree reaches it before ./src/polyfill
// has set global.Buffer, the Keystone sign request fails with
// "Unsupported output format: undefined". The polyfill must load first.
describe('index.js import order', () => {
  it('imports ./src/polyfill before anything else', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', '..', 'index.js'),
      'utf8',
    )
    const imports = [...source.matchAll(/^import\b[^\n]*?['"]([^'"]+)['"]/gm)]
    expect(imports[0]?.[1]).toBe('./src/polyfill')
  })

  it('does not import the polyfill again from App.tsx', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'App.tsx'),
      'utf8',
    )
    expect(source).not.toMatch(/^import '\.\/polyfill'/m)
  })
})
