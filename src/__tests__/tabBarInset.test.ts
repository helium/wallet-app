import fs from 'fs'
import path from 'path'

// The native tab bar floats over every screen in a tab stack, and iOS no
// longer insets their scroll views. Each screen clears the bar itself with
// TabSafeAreaView (BackScreen wraps one). Structural: the screens cannot
// render under jest's node environment, so this walks the navigators from
// TabBarNavigator and reads each registered screen's source.
const SRC = path.join(__dirname, '..')

const ALIASES: Record<string, string> = {
  '@ui/': 'ui/',
  '@hooks/': 'hooks/',
  '@utils/': 'utils/',
  '@storage/': 'storage/',
}

// Screens and navigators that sit in a tab stack but do not need the inset,
// with the reason. A navigator listed here is not walked.
const NOT_NEEDED: Record<string, string> = {
  'features/settings/SecretKeyWarningScreen.tsx':
    'renders its child screen, checked here, under a centred warning',
  'features/migration/SolanaMigration.tsx':
    'Settings presents it as a transparent modal over the bar, and the tab navigator portals it to the root, where the tab inset is zero',
}

// Shared components that clear the bar for the screens that render them.
const CLEARING_COMPONENTS: Record<string, string> = {
  AccountTokenList: 'features/account/AccountTokenList.tsx',
  ContactDetails: 'features/addressBook/ContactDetails.tsx',
  ContactsList: 'features/addressBook/ContactsList.tsx',
  ConfirmWordsScreen: 'features/onboarding/create/ConfirmWordsScreen.tsx',
  AccountCreateStart: 'features/onboarding/create/AccountCreateStart.tsx',
  OnboardingScreen:
    'features/hotspot-onboarding/components/OnboardingScreen.tsx',
  QrScanner: 'ui/QrScanner.tsx',
  RevealWords: 'ui/RevealWords.tsx',
}

const INSET_USER = /\b(TabSafeAreaView|BackScreen)\b/
const CLEARING_USER = new RegExp(
  `<(${Object.keys(CLEARING_COMPONENTS).join('|')})\\b`,
)
// The source without comments, so a comment that names a component does
// not count as rendering it.
const codeOf = (file: string) =>
  fs
    .readFileSync(path.join(SRC, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
const clearsBar = (key: string) => {
  const source = codeOf(key)
  return INSET_USER.test(source) || CLEARING_USER.test(source)
}
const NAVIGATOR = /\bcreate\w*Navigator\s*[(<]/

const resolveFile = (from: string, spec: string) => {
  const alias = Object.keys(ALIASES).find((prefix) => spec.startsWith(prefix))
  let base: string
  if (alias) {
    base = path.join(SRC, ALIASES[alias], spec.slice(alias.length))
  } else if (spec.startsWith('.')) {
    base = path.join(path.dirname(from), spec)
  } else {
    return undefined
  }
  return ['.tsx', '.ts', '/index.tsx', '/index.ts']
    .map((ext) => base + ext)
    .find((file) => fs.existsSync(file))
}

const importOf = (file: string, source: string, name: string) => {
  const match =
    source.match(
      new RegExp(`import\\s+${name}\\s*(?:,\\s*{[^}]*})?\\s+from\\s+'([^']+)'`),
    ) ??
    source.match(
      new RegExp(
        `import\\s+(?:\\w+\\s*,\\s*)?{[^}]*\\b${name}\\b[^}]*}\\s+from\\s+'([^']+)'`,
      ),
    )
  return match ? resolveFile(file, match[1]) : undefined
}

// A component defined in the navigator file itself: the files of the
// components it renders.
const localComponentFiles = (file: string, source: string, name: string) => {
  const start = source.search(new RegExp(`const\\s+${name}\\s*=`))
  if (start < 0) return []
  const rest = source.slice(start)
  const body = rest.slice(0, rest.search(/\n\s{0,2}}/) + 1)
  return [...body.matchAll(/<([A-Z]\w*)/g)]
    .map(([, tag]) => importOf(file, source, tag))
    .filter((found): found is string => !!found)
}

const screenFiles = (navigator: string, seen = new Set<string>()) => {
  const source = fs.readFileSync(navigator, 'utf8')
  const found: string[] = []
  ;[...source.matchAll(/component=\{(\w+)\}/g)].forEach(([, name]) => {
    const imported = importOf(navigator, source, name)
    const files = imported
      ? [imported]
      : localComponentFiles(navigator, source, name)
    if (!files.length) {
      throw new Error(`${path.relative(SRC, navigator)}: cannot find ${name}`)
    }
    files.forEach((file) => {
      if (seen.has(file)) return
      seen.add(file)
      const key = path.relative(SRC, file)
      if (NOT_NEEDED[key] === undefined) {
        const screenSource = fs.readFileSync(file, 'utf8')
        if (NAVIGATOR.test(screenSource)) {
          found.push(...screenFiles(file, seen))
          return
        }
      }
      found.push(key)
    })
  })
  return found
}

const tabScreens = screenFiles(path.join(SRC, 'navigation/TabBarNavigator.tsx'))

describe('screens under the floating tab bar', () => {
  it('finds the screens of every tab stack', () => {
    expect(tabScreens).toEqual(
      expect.arrayContaining([
        'features/account/AccountsScreen.tsx',
        'features/collectables/NftList.tsx',
        'features/activity/ActivityScreen.tsx',
        'features/browser/BrowserScreen.tsx',
        'features/governance/ProposalsScreen.tsx',
      ]),
    )
  })

  it('clears the bar on every screen not exempted', () => {
    const missing = tabScreens.filter(
      (key) => NOT_NEEDED[key] === undefined && !clearsBar(key),
    )
    expect(missing).toEqual([])
  })

  it('counts only shared components that clear the bar themselves', () => {
    const notClearing = Object.values(CLEARING_COMPONENTS).filter(
      (file) => !INSET_USER.test(codeOf(file)),
    )
    expect(notClearing).toEqual([])
  })

  it('exempts only screens that are in a tab stack and skip the inset', () => {
    const stale = Object.keys(NOT_NEEDED).filter(
      (key) => !tabScreens.includes(key) || clearsBar(key),
    )
    expect(stale).toEqual([])
  })

  // A scroller inside TabSafeAreaView, or one that asks iOS for the
  // automatic inset, stops at the bar's top edge. The proposal rows scroll
  // under the bar, and a bottom spacer as the last scroll child lets the
  // last row clear it.
  it('lets the proposal overview scroll under the bar', () => {
    const source = codeOf('features/governance/ProposalScreen.tsx')
    expect(source).not.toMatch(/contentInsetAdjustmentBehavior="automatic"/)
    expect(source).not.toMatch(/withUniwind\(TabSafeAreaView\)/)
    expect(source).toMatch(
      /<TabSafeAreaView edges=\{\['bottom'\]\} \/>\s*<\/ScrollView>/,
    )
  })

  // The map draws under the bar, so only the top edge insets it. A bottom
  // spacer under the map controls lifts them above the bar and measures the
  // bar inset, which lifts the details sheet and recentres the camera.
  it('lets the hotspot map draw under the bar and the Dynamic Island', () => {
    const source = codeOf('features/collectables/HotspotMapScreen.tsx')
    expect(source).not.toMatch(/'top',\s*'bottom'/)
    expect(source).not.toMatch(/<SafeArea\b/)
    expect(source).toMatch(
      /<View pointerEvents="box-none" className="absolute top-0 w-full">\s*<TabSafeAreaView edges=\{\['top'\]\} \/>/,
    )
    expect(source).toMatch(
      /<TabSafeAreaView\s+edges=\{\['bottom'\]\}\s+onLayout=\{\(e\) =>\s*setTabBarInset\(e\.nativeEvent\.layout\.height\)\s*\}\s*\/>/,
    )
    expect(source).toMatch(
      /<BottomSheetModal[^>]*\bbottomInset=\{tabBarInset\}/,
    )
    expect(source).toMatch(/tabBarInset \/ 2/)
  })
})
