import fs from 'fs'
import path from 'path'

const ORPC_CLIENT = path.resolve(
  __dirname,
  '../../node_modules/@orpc/client/dist/index.mjs',
)

describe('Hermes syntax in patched dependencies', () => {
  it('has no destructured rest parameter in an async arrow in @orpc/client', () => {
    // Hermes V1 rejects a destructured rest parameter in an async arrow; patches/@orpc+client+1.13.4.patch removes it.
    expect(fs.readFileSync(ORPC_CLIENT, 'utf8')).not.toMatch(
      /async\s*\(\s*\.\.\.\s*\[/,
    )
  })
})
