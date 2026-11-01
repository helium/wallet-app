import fs from 'fs'
import { findInstalledCopies, ROOT_NODE_MODULES } from './installedCopies'

type Version = [number, number, number]

const parseVersion = (version: string): Version => {
  const [major, minor, patch] = version.split(/[.+-]/).map(Number)
  return [major, minor, patch]
}

const isBelow = (version: Version, floor: Version): boolean => {
  const index = version.findIndex((part, i) => part !== floor[i])
  return index !== -1 && version[index] < floor[index]
}

// Per major line: `yarn npm audit -R` reports no advisory at or above the floor.
const ADVISORY_FLOORS: Record<string, Record<number, Version>> = {
  axios: { 0: [0, 33, 0], 1: [1, 21, 0] },
  'markdown-it': { 14: [14, 3, 3] },
}

const installedVersions = (name: string): string[] =>
  findInstalledCopies(ROOT_NODE_MODULES, `${name}/package.json`).map(
    (copy) => JSON.parse(fs.readFileSync(copy, 'utf8')).version,
  )

describe('installed dependency copies', () => {
  it.each(Object.keys(ADVISORY_FLOORS))(
    'has no installed %s below its advisory fix',
    (name) => {
      const versions = installedVersions(name)
      const vulnerable = versions.filter((version) => {
        const parsed = parseVersion(version)
        const floor = ADVISORY_FLOORS[name][parsed[0]]
        return !floor || isBelow(parsed, floor)
      })

      expect(versions.length).toBeGreaterThan(0)
      expect(vulnerable).toEqual([])
    },
  )
})
