import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const metroConfig = require('../../metro.config')

const ROOT = path.join(__dirname, '..', '..')
const ANCHOR_CORE = path.join(ROOT, 'node_modules', '@anchor-lang', 'core')

const resolve = (moduleName: string, originModulePath: string) => {
  const resolveRequest = jest.fn((_context: unknown, target: string) => target)
  return metroConfig.resolver.resolveRequest(
    { originModulePath, resolveRequest },
    moduleName,
    'ios',
  )
}

const APP_FILE = path.join(ROOT, 'src', 'hooks', 'useLedger.ts')
const PYTH_FILE = path.join(
  ROOT,
  'node_modules',
  '@pythnetwork',
  'client',
  'lib',
  'index.js',
)

describe('metro resolveRequest', () => {
  it('sends @coral-xyz/anchor from app code to @anchor-lang/core', () => {
    expect(resolve('@coral-xyz/anchor', APP_FILE)).toBe(ANCHOR_CORE)
    expect(resolve('@coral-xyz/anchor/dist/cjs/idl', APP_FILE)).toBe(
      path.join(ANCHOR_CORE, 'dist', 'cjs', 'idl'),
    )
  })

  it('leaves @coral-xyz/anchor from Pyth on its nested copy', () => {
    const resolved = resolve('@coral-xyz/anchor', PYTH_FILE)
    expect(resolved).toBe('@coral-xyz/anchor')
    expect(resolved).not.toContain('@anchor-lang/core')
  })

  it('resolves @anchor-lang/core to the root copy', () => {
    expect(resolve('@anchor-lang/core', PYTH_FILE)).toBe(ANCHOR_CORE)
  })
})
