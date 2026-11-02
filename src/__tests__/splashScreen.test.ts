import fs from 'fs'
import path from 'path'
import { getConfig } from 'expo/config'

// The native splash (expo-splash-screen) hands off to the JS splash in
// src/ui/SplashScreen.tsx. Both draw the same logo at the same size, centred
// on the same background, so the hand-off does not jump.
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const JS_SPLASH = fs.readFileSync(
  path.join(PROJECT_ROOT, 'src/ui/SplashScreen.tsx'),
  'utf8',
)

// Tailwind's `black` token.
const BLACK = '#000000'

const splashProps = () => {
  const { exp } = getConfig(PROJECT_ROOT, { skipSDKVersionRequirement: true })
  const entry = exp.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  )
  if (!Array.isArray(entry)) {
    throw new Error('expo-splash-screen has no props in app.json')
  }
  return entry[1]
}

const jsLogoSize = () => {
  const match = JS_SPLASH.match(/className="size-\[(\d+)px\]"/)
  if (!match) throw new Error('the JS splash logo has no size-[Npx] class')
  return Number(match[1])
}

describe('native splash', () => {
  it('draws the logo at the size the JS splash draws it', () => {
    expect(splashProps().imageWidth).toBe(jsLogoSize())
  })

  it('fills the background with the JS splash background token', () => {
    expect(JS_SPLASH).toMatch(/className="[^"]*\bbg-black\b[^"]*"/)
    expect(splashProps().backgroundColor).toBe(BLACK)
  })

  it('points at a logo image that exists', () => {
    const { image } = splashProps()

    expect(fs.existsSync(path.join(PROJECT_ROOT, image))).toBe(true)
  })

  it('uses the same logo image as the JS splash', () => {
    const match = JS_SPLASH.match(
      /require\('\.\.\/assets\/images\/(\w+)\.png'\)/,
    )
    if (!match) throw new Error('the JS splash requires no image')

    expect(splashProps().image).toBe(`./src/assets/images/${match[1]}@3x.png`)
  })
})
