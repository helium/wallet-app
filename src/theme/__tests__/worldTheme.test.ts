import fs from 'fs'
import path from 'path'

const THEME = path.resolve(__dirname, '../world-theme.css')

// CSS Color 4 hsl(): legacy comma syntax or modern space syntax, with `%` on
// saturation and lightness. A value outside both forms is dropped by the
// parser, so its token renders no fill.
const NUMBER = String.raw`-?\d*\.?\d+`
const LEGACY_HSL = new RegExp(`^hsl\\(${NUMBER}, ${NUMBER}%, ${NUMBER}%\\)$`)
const MODERN_HSL = new RegExp(
  `^hsl\\(${NUMBER} ${NUMBER}% ${NUMBER}%( / ${NUMBER}%?)?\\)$`,
)

const hslValues = () =>
  [
    ...fs.readFileSync(THEME, 'utf8').matchAll(/(--[\w-]+):\s*(hsl\([^)]*\))/g),
  ].map(([, name, value]) => ({ name, value }))

describe('world-theme.css', () => {
  it('declares hsl tokens', () => {
    expect(hslValues().length).toBeGreaterThan(0)
  })

  it('writes every hsl token in a syntax CSS accepts', () => {
    const invalid = hslValues().filter(
      ({ value }) => !LEGACY_HSL.test(value) && !MODERN_HSL.test(value),
    )

    expect(invalid).toEqual([])
  })
})
