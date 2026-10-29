import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

// RN 0.85 no longer exports StyleSheet.absoluteFillObject. A library that
// spreads it gets undefined and loses its full-bleed layout.
const FILL_PACKAGES = [
  'node_modules/@gorhom/bottom-sheet',
  'node_modules/react-native-video',
]

// Files patches/@gorhom+bottom-sheet+5.2.14.patch changes.
const SPRING_CONFIG_FILES = [
  'node_modules/@gorhom/bottom-sheet/src/constants.ts',
  'node_modules/@gorhom/bottom-sheet/lib/module/constants.js',
  'node_modules/@gorhom/bottom-sheet/lib/commonjs/constants.js',
]

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(entryPath)
    return /\.(js|ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })

describe('StyleSheet fill in native UI libraries', () => {
  it.each(FILL_PACKAGES)('%s never reads absoluteFillObject', (pkg) => {
    const files = ['src', 'lib'].flatMap((folder) =>
      sourceFiles(path.join(PROJECT_ROOT, pkg, folder)),
    )
    const readers = files.filter((file) =>
      fs.readFileSync(file, 'utf8').includes('absoluteFillObject'),
    )

    expect(files.length).toBeGreaterThan(0)
    expect(readers).toEqual([])
  })
})

describe('iOS bottom sheet spring', () => {
  it.each(SPRING_CONFIG_FILES)(
    'stops near the Reanimated 3 rest point in %s',
    (file) => {
      const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')
      expect(source).toContain('energyThreshold: 3e-6')
    },
  )
})
