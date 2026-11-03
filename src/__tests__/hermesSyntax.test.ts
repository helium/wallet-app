import fs from 'fs'
import { findInstalledCopies, ROOT_NODE_MODULES } from './installedCopies'

const ORPC_CLIENT = '@orpc/client/dist/index.mjs'
const UNPATCHED_REST_PARAM = /async\s*\(\s*\.\.\.\s*\[/

describe('Hermes syntax in patched dependencies', () => {
  it('has no destructured rest parameter in an async arrow in any installed @orpc/client', () => {
    // Hermes V1 rejects a destructured rest parameter in an async arrow; patches/@orpc+client+1.16.1.patch removes it.
    // Every installed copy must be patched, or deduped to the patched version.
    const copies = findInstalledCopies(ROOT_NODE_MODULES, ORPC_CLIENT)
    const unpatched = copies.filter((copy) =>
      UNPATCHED_REST_PARAM.test(fs.readFileSync(copy, 'utf8')),
    )

    expect(copies.length).toBeGreaterThan(0)
    expect(unpatched).toEqual([])
  })

  it('detects a destructured rest parameter in an async arrow only', () => {
    expect(
      UNPATCHED_REST_PARAM.test(
        'const f = async (...[input, options2 = {}]) => {}',
      ),
    ).toBe(true)
    expect(
      UNPATCHED_REST_PARAM.test('const f = async (input, options2 = {}) => {}'),
    ).toBe(false)
  })
})
