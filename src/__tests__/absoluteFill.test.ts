import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

// Files our patches change from StyleSheet.absoluteFillObject, which RN 0.85
// no longer exports, to StyleSheet.absoluteFill.
const PATCHED_FILES = [
  'node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx',
  'node_modules/@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/styles.ts',
  'node_modules/@gorhom/bottom-sheet/src/components/bottomSheetBackground/styles.ts',
  'node_modules/@gorhom/bottom-sheet/src/components/bottomSheetHostingContainer/styles.ts',
  'node_modules/@gorhom/bottom-sheet/lib/module/components/bottomSheet/BottomSheet.js',
  'node_modules/@gorhom/bottom-sheet/lib/module/components/bottomSheetBackdrop/styles.js',
  'node_modules/@gorhom/bottom-sheet/lib/module/components/bottomSheetBackground/styles.js',
  'node_modules/@gorhom/bottom-sheet/lib/module/components/bottomSheetHostingContainer/styles.js',
  'node_modules/@gorhom/bottom-sheet/lib/commonjs/components/bottomSheet/BottomSheet.js',
  'node_modules/@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetBackdrop/styles.js',
  'node_modules/@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetBackground/styles.js',
  'node_modules/@gorhom/bottom-sheet/lib/commonjs/components/bottomSheetHostingContainer/styles.js',
  'node_modules/react-native-video/src/Video.tsx',
  'node_modules/react-native-video/lib/Video.js',
]

describe('patched StyleSheet fill', () => {
  it.each(PATCHED_FILES)(
    'uses absoluteFill, which RN 0.85 still exports, in %s',
    (file) => {
      const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')
      expect(source).not.toContain('absoluteFillObject')
      expect(source).toContain('absoluteFill')
    },
  )
})
