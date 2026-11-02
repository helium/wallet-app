import fs from 'fs'
import path from 'path'
import { mapLayers } from '../map/mapLayers'

const THEME_CSS = fs.readFileSync(
  path.resolve(__dirname, '../../../theme/world-theme.css'),
  'utf8',
)

// world-theme.css writes its tokens as hsl(); MapLibre gets them as hex.
const hslToHex = (h: number, s: number, l: number): string => {
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

const themeHexColors = (): Set<string> => {
  const colors = new Set<string>()
  const hsl = /--[\w-]+:\s*hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*\)/g
  Array.from(THEME_CSS.matchAll(hsl)).forEach(([, h, s, l]) =>
    colors.add(hslToHex(Number(h), Number(s) / 100, Number(l) / 100)),
  )
  return colors
}

const paintColors = (): string[] =>
  mapLayers.flatMap((layer) =>
    Object.entries((layer.paint ?? {}) as Record<string, unknown>)
      .filter(([key]) => key.endsWith('-color'))
      .map(([, value]) => String(value).toLowerCase()),
  )

const paintColor = (id: string, key: string): string => {
  const layer = mapLayers.find((l) => l.id === id)
  return String((layer?.paint as Record<string, unknown>)[key]).toLowerCase()
}

// Relative luminance per WCAG 2.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('hotspot map layers', () => {
  it('converts a known token the way the test expects', () => {
    expect(hslToHex(0, 0, 0.961)).toBe('#f5f5f5')
    expect(hslToHex(220, 1, 0.58)).toBe('#2970ff')
  })

  it('takes every colour from a world-theme token', () => {
    const tokens = themeHexColors()
    const stray = paintColors().filter((color) => !tokens.has(color))

    expect(paintColors().length).toBeGreaterThan(0)
    expect(stray).toEqual([])
  })

  it('draws a light land background', () => {
    expect(luminance(paintColor('land', 'background-color'))).toBeGreaterThan(
      0.8,
    )
  })

  it('sets water apart from land', () => {
    expect(
      contrast(
        paintColor('land', 'background-color'),
        paintColor('water', 'fill-color'),
      ),
    ).toBeGreaterThan(1.1)
  })

  it('draws labels darker than their halo', () => {
    ;['places_city', 'places_state', 'places_country'].forEach((id) =>
      expect(
        contrast(
          paintColor(id, 'text-color'),
          paintColor(id, 'text-halo-color'),
        ),
      ).toBeGreaterThan(4.5),
    )
    expect(
      contrast(
        paintColor('roads_labels', 'text-color'),
        paintColor('land', 'background-color'),
      ),
    ).toBeGreaterThan(4.5)
  })
})
