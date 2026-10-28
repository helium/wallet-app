import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        MAINNET_RPC_URL: 'https://rpc.example.com',
      },
    },
  },
}))

const ROOT = path.join(__dirname, '..', '..', '..')

// The script both native builds run to embed the app config
// (EXConstants podspec phase on iOS, get-app-config-android.gradle).
const EMBED_SCRIPT = path.join(
  ROOT,
  'node_modules',
  'expo-constants',
  'scripts',
  'getAppConfig.js',
)

const embedAppConfig = (env: Record<string, string>) => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-config-'))
  execFileSync(process.execPath, [EMBED_SCRIPT, ROOT, outDir], {
    env: { ...process.env, ...env },
  })
  return JSON.parse(fs.readFileSync(path.join(outDir, 'app.config'), 'utf8'))
}

describe('app config', () => {
  it('embeds every key the app reads from the build environment', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CONFIG_KEYS } = require('../config')
    const env = Object.fromEntries(
      CONFIG_KEYS.map((key: string) => [key, `value-of-${key}`]),
    )

    const { extra } = embedAppConfig(env)

    CONFIG_KEYS.forEach((key: string) => {
      expect(extra[key]).toBe(`value-of-${key}`)
    })
    expect(extra.eas.projectId).toBe('737e4e9e-0a70-4685-b6cd-4ac3e91b0286')
  })

  it('reads the embedded values in the app', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Config = require('../config').default

    expect(Config.MAINNET_RPC_URL).toBe('https://rpc.example.com')
    expect(Config.DEVNET_RPC_URL).toBeUndefined()
  })
})
