import fs from 'fs'
import path from 'path'

const ROOT_NODE_MODULES = path.resolve(__dirname, '../../node_modules')
const ORPC_CLIENT = '@orpc/client/dist/index.mjs'

const packageDirs = (nodeModules: string): string[] =>
  fs
    .readdirSync(nodeModules, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .flatMap((entry) => {
      const dir = path.join(nodeModules, entry.name)
      if (!entry.name.startsWith('@')) return [dir]
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((scoped) => scoped.isDirectory())
        .map((scoped) => path.join(dir, scoped.name))
    })

const findInstalledCopies = (nodeModules: string, file: string): string[] => {
  const here = path.join(nodeModules, file)
  const nested = packageDirs(nodeModules).flatMap((dir) => {
    const inner = path.join(dir, 'node_modules')
    return fs.existsSync(inner) ? findInstalledCopies(inner, file) : []
  })
  return fs.existsSync(here) ? [here, ...nested] : nested
}

describe('Hermes syntax in patched dependencies', () => {
  it('has no destructured rest parameter in an async arrow in any installed @orpc/client', () => {
    // Hermes V1 rejects a destructured rest parameter in an async arrow; patches/@orpc+client+1.16.1.patch removes it.
    // Every installed copy must be patched, or deduped to the patched version.
    const copies = findInstalledCopies(ROOT_NODE_MODULES, ORPC_CLIENT)
    const unpatched = copies.filter((copy) =>
      /async\s*\(\s*\.\.\.\s*\[/.test(fs.readFileSync(copy, 'utf8')),
    )

    expect(copies.length).toBeGreaterThan(0)
    expect(unpatched).toEqual([])
  })
})
