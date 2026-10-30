import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const ROOT = path.join(__dirname, '..', '..', '..')

// Runs `scripts/maestro-surfpool.sh env` and returns its `export NAME=VALUE`
// lines as [name, value] pairs. The `env` branch exits before it starts
// surfpool or Docker.
const surfpoolEnv = (): [string, string][] =>
  execFileSync('bash', ['scripts/maestro-surfpool.sh', 'env'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const match = /^export (\w+)=(.*)$/.exec(line)
      if (!match) throw new Error(`not an export line: ${line}`)
      return [match[1], match[2]]
    })

describe('maestro-surfpool.sh env', () => {
  it('exports the fork URLs under the names config.ts reads', () => {
    const exports = surfpoolEnv()
    const config = fs.readFileSync(
      path.join(ROOT, 'src', 'utils', 'config.ts'),
      'utf8',
    )

    expect(Object.fromEntries(exports)).toEqual({
      EXPO_PUBLIC_MAINNET_RPC_URL: 'http://127.0.0.1:8899',
      EXPO_PUBLIC_MAINNET_HELIUM_TRANSACTION_API: 'http://127.0.0.1:3000',
    })
    exports.forEach(([name]) => {
      expect(config).toContain(`process.env.${name}`)
    })
  })
})
