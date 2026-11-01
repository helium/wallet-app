import path from 'path'
import { ESLint } from 'eslint'

// Jest cannot run the dynamic import ESLint uses to load the config file,
// so the test passes the config object in directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatConfig = require('../../eslint.config.js')

const ROOT = path.join(__dirname, '..', '..')
const APP_FILE = path.join(ROOT, 'src', 'App.tsx')

const ERROR = 2

describe('unused eslint-disable directives', () => {
  it('fail lint as errors', async () => {
    const config = await new ESLint({
      cwd: ROOT,
      overrideConfigFile: true,
      overrideConfig: flatConfig,
    }).calculateConfigForFile(APP_FILE)
    expect(config.linterOptions.reportUnusedDisableDirectives).toBe(ERROR)
  })
})
