import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

// MapLibre 11 jumps the camera, with no animation, when setStop gets no
// easing. A duration of 0 is a deliberate jump and needs none.
const CAMERA_FILES = [
  'src/features/collectables/AssertLocationScreen.tsx',
  'src/features/collectables/HotspotMapScreen.tsx',
]

const setStopCalls = (source: string): string[] =>
  source.match(/setStop\(\{[\s\S]*?\}\)/g) ?? []

describe('MapLibre camera easing', () => {
  it.each(CAMERA_FILES)(
    'every animated setStop has an easing in %s',
    (file) => {
      const source = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8')
      const calls = setStopCalls(source)
      const missing = calls.filter(
        (call) => !call.includes('duration: 0') && !call.includes('easing:'),
      )

      expect(calls.length).toBeGreaterThan(0)
      expect(missing).toEqual([])
    },
  )
})
