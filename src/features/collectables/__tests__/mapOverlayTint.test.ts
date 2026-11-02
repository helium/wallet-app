import fs from 'fs'
import path from 'path'

// The map is light, so the blur overlays drawn over it are light too.
const MAP_SCREENS = ['AssertLocationScreen.tsx', 'HotspotMapScreen.tsx']

describe('map screen overlays', () => {
  it.each(MAP_SCREENS)('every blur has a light tint in %s', (file) => {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
    const tints = Array.from(source.matchAll(/tint="(\w+)"/g)).map(
      ([, tint]) => tint,
    )

    expect(tints.length).toBeGreaterThan(0)
    expect(tints.filter((tint) => tint !== 'light')).toEqual([])
  })
})
