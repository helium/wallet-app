import path from 'path'
import { ESLint, Linter } from 'eslint'

// Jest cannot run the dynamic import ESLint uses to load the config file,
// so the test passes the config object in directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatConfig = require('../../eslint.config.js')

const ROOT = path.join(__dirname, '..', '..')
const APP_FILE = path.join(ROOT, 'src', 'App.tsx')

let ruleConfig: Linter.RuleEntry

beforeAll(async () => {
  const config = await new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: flatConfig,
  }).calculateConfigForFile(APP_FILE)
  ruleConfig = config.rules['no-restricted-properties']
})

const restrictedPropertyHits = (code: string) => {
  const messages = new Linter().verify(code, {
    rules: { 'no-restricted-properties': ruleConfig },
  })
  return messages.map((m) => m.ruleId)
}

describe('no-restricted-properties in app code', () => {
  it('rejects navigateDeprecated', () => {
    expect(
      restrictedPropertyHits("navigation.navigateDeprecated('Home')"),
    ).toEqual(['no-restricted-properties'])
  })

  it('allows navigate', () => {
    expect(restrictedPropertyHits("navigation.navigate('Home')")).toEqual([])
  })
})
