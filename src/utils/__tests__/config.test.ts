import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        MAINNET_RPC_URL: 'https://rpc.example.com',
        LOG_ANIMATIONS: true,
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

// Runs the embed script against a temp copy of the project that holds the
// given env files, with a minimal process env plus `env`.
const embedAppConfig = (
  files: Record<string, string>,
  env: Record<string, string> = {},
) => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-project-'))
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-config-'))
  try {
    ;['package.json', 'app.json', 'app.config.ts'].forEach((name) => {
      fs.copyFileSync(path.join(ROOT, name), path.join(projectDir, name))
    })
    fs.symlinkSync(
      path.join(ROOT, 'node_modules'),
      path.join(projectDir, 'node_modules'),
    )
    Object.entries(files).forEach(([name, contents]) => {
      fs.writeFileSync(path.join(projectDir, name), contents)
    })
    const result = spawnSync(
      process.execPath,
      [EMBED_SCRIPT, projectDir, outDir],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          ...env,
          // expo's global types require NODE_ENV, which this env leaves out.
        } as unknown as NodeJS.ProcessEnv,
      },
    )
    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`Embed script failed: ${result.stderr}`)
    }
    return {
      ...JSON.parse(fs.readFileSync(path.join(outDir, 'app.config'), 'utf8')),
      stderr: result.stderr,
    }
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true })
    fs.rmSync(outDir, { recursive: true, force: true })
  }
}

describe('app config', () => {
  it('embeds every key the app reads from the build environment', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CONFIG_KEYS } = require('../config')
    const literals: Record<string, string> = {
      ONE_SIGNAL_ACCOUNT_TAG_SALT: '$2a$10$abcdefghijklmnopqrstuv',
      PRIVY_CLIENT_ID: 'client-$HOME-x',
      WALLET_REST_URI: 'https://wallet.example.com/api#frag',
    }
    const expected: Record<string, string> = Object.fromEntries(
      CONFIG_KEYS.map((key: string) => [
        key,
        literals[key] ?? `value-of-${key}`,
      ]),
    )
    expected.PRIVY_APP_ID = 'quoted-id'
    expected.VIEW_AS = 'unbalanced'
    const lines: Record<string, string> = {
      PRIVY_APP_ID: "PRIVY_APP_ID='quoted-id'",
      MAINNET_RPC_URL: `MAINNET_RPC_URL = ${expected.MAINNET_RPC_URL}`,
      DEVNET_RPC_URL: `  DEVNET_RPC_URL=${expected.DEVNET_RPC_URL}`,
      PMTILES_URL: `PMTILES_URL=${expected.PMTILES_URL}   `,
      VIEW_AS: 'VIEW_AS="unbalanced',
    }
    const entries = CONFIG_KEYS.map(
      (key: string) => lines[key] ?? `${key}=${expected[key]}`,
    )
    const middle = Math.floor(entries.length / 2)
    const dotEnv = `${[
      '# comment',
      ...entries.slice(0, middle),
      '',
      ...entries.slice(middle),
    ].join('\n')}\n`

    const { extra } = embedAppConfig({ '.env': dotEnv })

    CONFIG_KEYS.forEach((key: string) => {
      expect(extra[key]).toBe(expected[key])
    })
    const appJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'),
    )
    expect(extra.eas.projectId).toBe(appJson.extra.eas.projectId)
  })

  it('fails the build on a malformed .env line without printing it', () => {
    let message = ''
    try {
      embedAppConfig({ '.env': 'not a valid line' })
    } catch (error) {
      message = (error as Error).message
    }

    expect(message).toMatch(/Invalid entry in .env at line 1/)
    expect(message).not.toContain('not a valid line')
  })

  it('reads only .env, not .env.local or the shell env', () => {
    const { extra } = embedAppConfig(
      {
        '.env': 'MAINNET_RPC_URL=https://rpc.example.com',
        '.env.local': 'VIEW_AS=from-env-local',
      },
      { VIEW_AS: 'from-shell' },
    )

    expect(extra.VIEW_AS).toBeUndefined()
  })

  it('embeds undefined values and warns when .env is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CONFIG_KEYS } = require('../config')

    const { extra, stderr } = embedAppConfig({})

    CONFIG_KEYS.forEach((key: string) => {
      expect(extra[key]).toBeUndefined()
    })
    const appJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'),
    )
    expect(extra.eas.projectId).toBe(appJson.extra.eas.projectId)
    expect(stderr).toContain('Missing .env')
  })

  it('reads the embedded values in the app', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Config = require('../config').default

    expect(Config.MAINNET_RPC_URL).toBe('https://rpc.example.com')
    expect(Config.DEVNET_RPC_URL).toBeUndefined()
    expect(Config.LOG_ANIMATIONS).toBeUndefined()
  })

  it('warns and reads undefined when the embedded app config is missing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    // Earlier tests cached the expo-constants mock, which doMock cannot
    // override inside isolateModules.
    jest.resetModules()
    try {
      jest.isolateModules(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: { expoConfig: null },
        }))
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Config = require('../config').default

        expect(warn).toHaveBeenCalled()
        expect(Config.MAINNET_RPC_URL).toBeUndefined()
      })
    } finally {
      warn.mockRestore()
    }
  })
})
