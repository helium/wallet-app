import fs from 'fs'
import os from 'os'
import path from 'path'
import { findInstalledCopies } from './installedCopies'

describe('findInstalledCopies', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'copies-'))
  const nodeModules = path.join(dir, 'node_modules')
  const copies = [
    'node_modules/x/package.json',
    'node_modules/a/node_modules/x/package.json',
    'node_modules/@s/b/node_modules/x/package.json',
    'node_modules/a/node_modules/c/node_modules/x/package.json',
  ].map((copy) => path.join(dir, copy))

  beforeAll(() => {
    copies.forEach((copy) => {
      fs.mkdirSync(path.dirname(copy), { recursive: true })
      fs.writeFileSync(copy, '{}')
    })
  })

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('finds copies at the root, nested, under a scope and two levels deep', () => {
    expect(findInstalledCopies(nodeModules, 'x/package.json').sort()).toEqual(
      [...copies].sort(),
    )
  })
})
