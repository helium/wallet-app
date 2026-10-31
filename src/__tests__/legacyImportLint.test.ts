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

const WARN = 1
const ERROR = 2

describe('legacy import ban', () => {
  it.each([
    "import Text from '@components/Text'",
    "import { Box } from '@components'",
    "import { useTheme } from '@shopify/restyle'",
  ])('warns on `%s` in code not yet migrated', async (code) => {
    expect(await restrictedImportHits('src/utils/X.tsx', code)).toEqual([WARN])
  })

  it('rejects legacy imports in @ui code', async () => {
    expect(
      await restrictedImportHits(
        'src/ui/X.tsx',
        "import Text from '@components/Text'",
      ),
    ).toEqual([ERROR])
  })

  it('rejects legacy imports in the UI gallery', async () => {
    expect(
      await restrictedImportHits(
        'src/features/uiGallery/X.tsx',
        "import Text from '@components/Text'",
      ),
    ).toEqual([ERROR])
  })

  it.each([
    'src/features/account/X.tsx',
    'src/features/home/X.tsx',
    'src/features/payment/X.tsx',
  ])('rejects legacy imports in migrated %s', async (file) => {
    expect(
      await restrictedImportHits(file, "import Box from '@components/Box'"),
    ).toEqual([ERROR])
  })

  it('allows a listed shared composite in migrated code', async () => {
    expect(
      await restrictedImportHits(
        'src/features/home/X.tsx',
        "import TabBar from '@components/TabBar'",
      ),
    ).toEqual([])
  })

  it.each(['src/ui', 'src/features/uiGallery', 'src/features/migration'])(
    'rejects a shared composite in %s',
    async (dir) => {
      expect(
        await restrictedImportHits(
          `${dir}/X.tsx`,
          "import HNTKeyboard from '@components/HNTKeyboard'",
        ),
      ).toEqual([ERROR])
    },
  )

  const featuresMigratedWithSharedComposites = [
    'addressBook',
    'browser',
    'burn',
    'dappLogin',
    'request',
    'txnDelegation',
  ]

  it.each(featuresMigratedWithSharedComposites)(
    'rejects legacy imports in src/features/%s',
    async (feature) => {
      expect(
        await restrictedImportHits(
          `src/features/${feature}/X.tsx`,
          "import Box from '@components/Box'",
        ),
      ).toEqual([ERROR])
    },
  )

  it.each(featuresMigratedWithSharedComposites)(
    'allows a shared composite in src/features/%s',
    async (feature) => {
      expect(
        await restrictedImportHits(
          `src/features/${feature}/X.tsx`,
          "import HNTKeyboard from '@components/HNTKeyboard'",
        ),
      ).toEqual([])
    },
  )

  it('allows the address book selector in src/features/burn', async () => {
    expect(
      await restrictedImportHits(
        'src/features/burn/X.tsx',
        "import AddressBookSelector from '@components/AddressBookSelector'",
      ),
    ).toEqual([])
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
