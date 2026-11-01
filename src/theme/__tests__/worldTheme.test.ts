import fs from 'fs'
import path from 'path'

const THEME = path.resolve(__dirname, '..', 'world-theme.css')

const NUMBER = String.raw`\d+(?:\.\d+)?`
// CSS Color 4 hsl(): hue, then saturation and lightness as percentages, in
// the legacy comma form or the space form.
const VALID_HSL = new RegExp(
  String.raw`^hsl\(\s*${NUMBER}(?:deg)?(?:\s*,\s*|\s+)${NUMBER}%(?:\s*,\s*|\s+)${NUMBER}%\s*\)$`,
)

describe('world-theme.css', () => {
  it('writes every hsl() colour in a form CSS parses', () => {
    const source = fs.readFileSync(THEME, 'utf8')
    const colours = source.match(/hsla?\([^)]*\)/g) ?? []

    expect(colours.length).toBeGreaterThan(0)
    expect(colours.filter((colour) => !VALID_HSL.test(colour))).toEqual([])
  })
})
