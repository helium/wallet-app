import fs from 'fs'
import { ADVISORY_FLOORS, isBelow, vulnerableVersions } from './advisoryFloors'
import { findInstalledCopies, ROOT_NODE_MODULES } from './installedCopies'

const installedVersions = (name: string): string[] =>
  findInstalledCopies(ROOT_NODE_MODULES, `${name}/package.json`).map(
    (copy) => JSON.parse(fs.readFileSync(copy, 'utf8')).version,
  )

describe('installed dependency copies', () => {
  it.each(Object.keys(ADVISORY_FLOORS))(
    'has no %s copy in a node_modules chain below its advisory fix',
    (name) => {
      const versions = installedVersions(name)
      const vulnerable = vulnerableVersions(ADVISORY_FLOORS[name], versions)

      expect(versions.length).toBeGreaterThan(0)
      expect(vulnerable).toEqual([])
    },
  )
})

describe('advisory floor checks', () => {
  it('compares a version against its floor', () => {
    expect(isBelow([1, 20, 9], [1, 21, 0])).toBe(true)
    expect(isBelow([1, 21, 0], [1, 21, 0])).toBe(false)
    expect(isBelow([1, 22, 0], [1, 21, 0])).toBe(false)
    expect(isBelow([0, 33, 0], [0, 34, 0])).toBe(true)
  })

  it('flags versions below the floor, prereleases and unfloored major lines', () => {
    expect(
      vulnerableVersions({ 1: [1, 21, 0] }, [
        '1.21.0',
        '1.22.3',
        '1.20.0',
        '1.21.0-beta.1',
        '2.0.0',
      ]),
    ).toEqual(['1.20.0', '1.21.0-beta.1', '2.0.0'])
  })
})
