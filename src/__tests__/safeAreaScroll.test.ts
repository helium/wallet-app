import fs from 'fs'
import path from 'path'
import ts from 'typescript'

// A scroller inside a SafeAreaView loses the strips the safe area pads: its
// content cannot scroll under the status bar or the floating tab bar, and a
// screen that also insets the scroller pads the edge twice. The SafeAreaView
// wraps only the fixed headers and footers; the scroller is their sibling.
// Structural: the screens cannot render under jest's node environment, so
// this reads the JSX nesting of every source file.
const SRC = path.join(__dirname, '..')

// Screens that still nest a scroller in a safe area, with the reason.
const NOT_YET_SPLIT: Record<string, string> = {
  'features/burn/BurnScreen.tsx':
    'a short keyboard-aware form under a fixed header; it does not scroll under the bars',
  'features/request/RequestScreen.tsx':
    'a short keyboard-aware form under a fixed header and tabs; it does not scroll under the bars',
  'features/collectables/HotspotMapScreen.tsx':
    'the scroller is in the bottom sheet over the map, which does not reach the bars',
}

const SCROLLER = /(ScrollView|FlatList|SectionList|FlashList)$/
const SAFE_AREA = /SafeArea(View)?$/

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(entryPath)
    }
    return entry.name.endsWith('.tsx') ? [path.relative(SRC, entryPath)] : []
  })

const tagName = (element: ts.JsxOpeningLikeElement) =>
  ts.isPropertyAccessExpression(element.tagName)
    ? element.tagName.name.text
    : element.tagName.getText()

// Each scroller the file renders inside a safe area, as `SafeArea > Scroller`.
const scrollersInSafeArea = (file: string) => {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(path.join(SRC, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const found: string[] = []
  const walk = (node: ts.Node, safeArea?: string) => {
    let inside = safeArea
    const element = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : undefined
    if (element) {
      const name = tagName(element)
      if (safeArea && SCROLLER.test(name)) found.push(`${safeArea} > ${name}`)
      if (SAFE_AREA.test(name)) inside = name
    }
    ts.forEachChild(node, (child) => walk(child, inside))
  }
  walk(source)
  return found
}

const files = sourceFiles(SRC)

describe('scrollers and safe areas', () => {
  it('reads the screens', () => {
    expect(files).toEqual(
      expect.arrayContaining([
        'features/settings/Settings.tsx',
        'features/activity/ActivityScreen.tsx',
        'ui/GlobalError.tsx',
      ]),
    )
  })

  it('renders no scroller inside a safe area', () => {
    const nested = files
      .filter((file) => NOT_YET_SPLIT[file] === undefined)
      .flatMap((file) =>
        scrollersInSafeArea(file).map((found) => `${file}: ${found}`),
      )
    expect(nested).toEqual([])
  })

  it('exempts only screens that still nest a scroller', () => {
    const stale = Object.keys(NOT_YET_SPLIT).filter(
      (file) => !files.includes(file) || !scrollersInSafeArea(file).length,
    )
    expect(stale).toEqual([])
  })
})
