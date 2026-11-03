import fs from 'fs'
import path from 'path'

export const ROOT_NODE_MODULES = path.resolve(__dirname, '../../node_modules')

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

// Walks node_modules/<pkg>/node_modules chains; copies under a package subfolder (protobufjs/cli/node_modules, build tooling) are not walked.
export const findInstalledCopies = (
  nodeModules: string,
  file: string,
): string[] => {
  const here = path.join(nodeModules, file)
  const nested = packageDirs(nodeModules).flatMap((dir) => {
    const inner = path.join(dir, 'node_modules')
    return fs.existsSync(inner) ? findInstalledCopies(inner, file) : []
  })
  return fs.existsSync(here) ? [here, ...nested] : nested
}
