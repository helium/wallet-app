export type Version = [number, number, number]

export const parseVersion = (version: string): Version => {
  const [major, minor, patch] = version.split(/[.+-]/).map(Number)
  return [major, minor, patch]
}

export const isBelow = (version: Version, floor: Version): boolean => {
  const index = version.findIndex((part, i) => part !== floor[i])
  return index !== -1 && version[index] < floor[index]
}

// Per major line: `yarn npm audit -R` reports no advisory at or above the floor.
// A prerelease counts as vulnerable: it sorts below its release.
export const ADVISORY_FLOORS: Record<string, Record<number, Version>> = {
  axios: { 0: [0, 33, 0], 1: [1, 21, 0] },
  'markdown-it': { 14: [14, 3, 3] },
}

export const vulnerableVersions = (
  floors: Record<number, Version>,
  versions: string[],
): string[] =>
  versions.filter((version) => {
    const parsed = parseVersion(version)
    const floor = floors[parsed[0]]
    return /-/.test(version) || !floor || isBelow(parsed, floor)
  })
