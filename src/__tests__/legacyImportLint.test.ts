import path from 'path'
import { ESLint, Linter } from 'eslint'

// Jest cannot run the dynamic import ESLint uses to load the config file,
// so the test passes the config object in directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const flatConfig = require('../../eslint.config.js')

const ROOT = path.join(__dirname, '..', '..')

const restrictedImportHits = async (relativePath: string, code: string) => {
  const config = await new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: flatConfig,
  }).calculateConfigForFile(path.join(ROOT, relativePath))
  const messages = new Linter().verify(code, {
    languageOptions: { sourceType: 'module' },
    rules: { 'no-restricted-imports': config.rules['no-restricted-imports'] },
  })
  return messages.map((m) => m.severity)
}

const ERROR = 2

describe('legacy import ban', () => {
  it.each([
    "import Text from '@components/Text'",
    "import { Box } from '@components'",
    "import { useTheme } from '@shopify/restyle'",
  ])('rejects `%s` everywhere', async (code) => {
    expect(await restrictedImportHits('src/utils/X.tsx', code)).toEqual([ERROR])
  })

  it.each([
    'src/ui/X.tsx',
    'src/features/uiGallery/X.tsx',
    'src/features/home/X.tsx',
    'index.js',
  ])('rejects legacy imports in %s', async (file) => {
    expect(
      await restrictedImportHits(file, "import Box from '@components/Box'"),
    ).toEqual([ERROR])
  })

  it('allows @ui imports', async () => {
    expect(
      await restrictedImportHits(
        'src/ui/X.tsx',
        "import { Text } from '@ui/Text'",
      ),
    ).toEqual([])
  })
})
