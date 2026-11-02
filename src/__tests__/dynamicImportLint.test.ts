import path from 'path'
import { ESLint, Linter } from 'eslint'

// Jest cannot run the dynamic import ESLint uses to load the config file,
// so the test passes the config object in directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatConfig = require('../../eslint.config.js')

const ROOT = path.join(__dirname, '..', '..')

const restrictedSyntaxHits = async (relativePath: string, code: string) => {
  const config = await new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: flatConfig,
  }).calculateConfigForFile(path.join(ROOT, relativePath))
  const messages = new Linter().verify(code, {
    languageOptions: { sourceType: 'module' },
    rules: { 'no-restricted-syntax': config.rules['no-restricted-syntax'] },
  })
  return messages.map((m) => m.severity)
}

const ERROR = 2

// In a native dev build, Expo loads an import() as a split bundle and then
// calls its own HMR client, which only web sets up. Each import() therefore
// rejects with "Expected HMRClient.setup() call at startup." and LogBox
// shows a toast.
describe('dynamic import ban', () => {
  it.each(['index.js', 'src/features/home/X.tsx', 'src/utils/X.ts'])(
    'rejects import() in %s',
    async (file) => {
      expect(
        await restrictedSyntaxHits(file, "import('./ReactotronConfig')"),
      ).toEqual([ERROR])
    },
  )

  it('allows require', async () => {
    expect(
      await restrictedSyntaxHits('index.js', "require('./ReactotronConfig')"),
    ).toEqual([])
  })
})
