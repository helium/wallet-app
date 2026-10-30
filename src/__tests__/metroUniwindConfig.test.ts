import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ROOT = path.join(__dirname, '..', '..')
const APP_FILE = path.join(ROOT, 'src', 'hooks', 'useLedger.ts')

type WrappedConfig = {
  transformerPath: string
  babelTransformerPath: string
  cssEntryFile: string
  anchor: { type: string; filePath: string }
  reactNative: { type: string; filePath: string }
}

const SCRIPT = `
const cfg = require('./metro.config.js')
const anchor = cfg.resolver.resolveRequest(
  {
    originModulePath: ${JSON.stringify(APP_FILE)},
    resolveRequest: (_ctx, target) => ({ type: 'sourceFile', filePath: target }),
  },
  '@coral-xyz/anchor',
  'ios',
)
const reactNative = cfg.resolver.resolveRequest(
  {
    originModulePath: ${JSON.stringify(APP_FILE)},
    resolveRequest: (_ctx, target) => ({
      type: 'sourceFile',
      filePath: require.resolve(target, { paths: [process.cwd()] }),
    }),
  },
  'react-native',
  'ios',
)
process.stdout.write(JSON.stringify({
  transformerPath: cfg.transformerPath,
  babelTransformerPath: cfg.transformer.babelTransformerPath,
  cssEntryFile: cfg.transformer.uniwind.cssEntryFile,
  anchor,
  reactNative,
}))
`

describe('metro config wrapped by uniwind', () => {
  let config: WrappedConfig

  beforeAll(() => {
    // Jest cannot load @tailwindcss/node in-process, so load the config in a child node.
    const output = execFileSync(process.execPath, ['-e', SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
    })
    config = JSON.parse(output) as WrappedConfig
  })

  it('uses the uniwind transformer', () => {
    expect(config.transformerPath).toContain(
      path.join('node_modules', 'uniwind') + path.sep,
    )
  })

  it('keeps the app babel transformer', () => {
    expect(config.babelTransformerPath).toBe(
      path.join(ROOT, 'metro.transformer.js'),
    )
  })

  it('points the css entry at src/global.css', () => {
    const cssEntry = path.resolve(ROOT, config.cssEntryFile)
    expect(fs.existsSync(cssEntry)).toBe(true)
    expect(cssEntry).toBe(path.join(ROOT, 'src', 'global.css'))
  })

  it('still sends @coral-xyz/anchor to @anchor-lang/core', () => {
    expect(config.anchor.filePath).toBe(
      path.join(ROOT, 'node_modules', '@anchor-lang', 'core'),
    )
  })

  it('sends react-native to the uniwind components', () => {
    expect(config.reactNative.filePath).toContain(
      path.join('node_modules', 'uniwind') + path.sep,
    )
  })
})
