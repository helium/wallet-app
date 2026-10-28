import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ESLint, Linter } = require('eslint')

const ROOT = path.join(__dirname, '..', '..')
const APP_FILE = path.join(ROOT, 'src', 'App.tsx')

// The config loads once per process: ESLint mutates shared airbnb rule
// options during validation, so a second load in one process fails.
let ruleConfig: unknown

beforeAll(async () => {
  const config = await new ESLint({ cwd: ROOT }).calculateConfigForFile(
    APP_FILE,
  )
  ruleConfig = config.rules['no-restricted-properties']
})

const restrictedPropertyHits = (code: string) => {
  const messages: { ruleId: string }[] = new Linter().verify(code, {
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

  it('keeps the airbnb restrictions', () => {
    expect(restrictedPropertyHits('Math.pow(2, 3)')).toEqual([
      'no-restricted-properties',
    ])
  })

  it('allows navigate', () => {
    expect(restrictedPropertyHits("navigation.navigate('Home')")).toEqual([])
  })
})
