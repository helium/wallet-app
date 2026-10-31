import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const SRC = path.join(PROJECT_ROOT, 'src')
const MOTION = path.join(SRC, 'theme', 'motion.ts')

const read = (file: string) =>
  fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')

const count = (source: string, needle: string) =>
  source.split(needle).length - 1

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(full)
    }
    if (full === MOTION || !/\.tsx?$/.test(entry.name)) return []
    return [full]
  })

// A Reanimated fade builder followed by `}` (a bare JSX prop) or by a chain
// of `.method(...)` calls. Import specifiers (followed by `,` or whitespace)
// do not match either branch and are skipped.
const FADE_USE = /\bFade(?:In|Out)\b(?:(\})|((?:\s*\.\w+\([^)]*\))+))?/g

// Reanimated's default ReduceMotion.System snaps fades under OS reduced
// motion. Fades are the motion reduced motion keeps, so they must opt out.
const OPACITY_TIMING_FILES = [
  'src/features/request/RequestScreen.tsx',
  'src/components/SecretKeyWarningScreen.tsx',
  'src/components/SplashScreen.tsx',
  'src/ui/SuccessReveal.tsx',
]

describe('fades run under reduced motion', () => {
  it('uses ReduceMotion.Never on every FadeIn/FadeOut builder', () => {
    const offenders: string[] = []
    sourceFiles(SRC).forEach((file) => {
      const source = fs.readFileSync(file, 'utf8')
      const rel = path.relative(PROJECT_ROOT, file)
      Array.from(source.matchAll(FADE_USE)).forEach((match) => {
        const [snippet, bare, chain] = match
        if (bare) {
          offenders.push(`${rel}: ${snippet}`)
        } else if (chain) {
          const flat = chain.replace(/\s+/g, '').replace(/,\)/g, ')')
          if (!flat.includes('.reduceMotion(ReduceMotion.Never)')) {
            offenders.push(`${rel}: ${snippet}`)
          }
        }
      })
    })
    expect(offenders).toEqual([])
  })

  it.each(OPACITY_TIMING_FILES)(
    'runs every opacity withTiming under reduced motion in %s',
    (file) => {
      const source = read(file)
      const timings = count(source, 'withTiming(')
      expect(timings).toBeGreaterThan(0)
      expect(count(source, 'reduceMotion: ReduceMotion.Never')).toBe(timings)
    },
  )
})

describe('IconPressedContainer haptic', () => {
  it('fires the haptic in onPress, not on touch end', () => {
    const source = read('src/components/IconPressedContainer.tsx')
    expect(source).not.toContain('onTouchEnd')
    expect(source).toMatch(
      /const handlePress = onPress\s*\?\s*\(event[^)]*\)\s*=>\s*\{\s*triggerImpact\([^)]*\)\s*onPress\(event\)/,
    )
  })
})

describe('PositionCard list row', () => {
  it('has no layout animation in the virtualized list', () => {
    const source = read('src/features/governance/PositionCard.tsx')
    expect(source).not.toContain('entering=')
    expect(source).not.toContain('exiting=')
  })
})
