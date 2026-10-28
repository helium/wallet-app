import { loadOptions, transformFileSync } from '@babel/core'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import vm from 'vm'

const ROOT = path.join(__dirname, '..', '..', '..')

// Every key the app reads, each from EXPO_PUBLIC_<key>
const KEYS = [
  'MAINNET_RPC_URL',
  'DEVNET_RPC_URL',
  'MAINNET_HELIUM_TRANSACTION_API',
  'DEVNET_HELIUM_TRANSACTION_API',
  'ONBOARDING_API_URL',
  'WALLET_REST_URI',
  'MIGRATION_SERVER_URL',
  'TOKENS_TO_RENT_SERVICE_URL',
  'TOKENS_TO_RENT_SERVICE_DEVNET_URL',
  'PMTILES_URL',
  'ONE_SIGNAL_APP_ID',
  'ONE_SIGNAL_ACCOUNT_TAG_SALT',
  'WALLET_CONNECT_PROJECT_ID',
  'WALLET_CONNECT_METADATA_URL',
  'HELIUM_VOTE_API_URL',
  'DEVNET_HELIUM_VOTE_API_URL',
  'PRIVY_APP_ID',
  'PRIVY_CLIENT_ID',
  'LOG_ANIMATIONS',
  'LOG_BREADCRUMBS',
  'OVERRIDE_MODEL_ID',
  'OVERRIDE_WIRED',
  'VIEW_AS',
]

// Runs `fn` with the env the Metro babel transformer sets for a release
// bundle (BABEL_ENV=production) plus `env`, then restores process.env.
const withBuildEnv = <T>(env: Record<string, string>, fn: () => T): T => {
  const saved = { ...process.env }
  Object.assign(process.env, { BABEL_ENV: 'production' }, env)
  try {
    return fn()
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in saved)) delete process.env[key]
    })
    Object.assign(process.env, saved)
  }
}

// The caller the Metro babel transformer passes (metro.config.js
// babelTransformerPath -> metro-react-native-babel-transformer).
const METRO_CALLER = { name: 'metro', bundler: 'metro', platform: 'ios' }

// Loads metro.config.js, as every bundle command does, in a temp copy of the
// project that holds `dotEnv` as .env, and returns the EXPO_PUBLIC_ vars it
// leaves in the bundler env.
const loadBundlerEnv = (dotEnv: string): Record<string, string> => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-project-'))
  try {
    ;[
      'package.json',
      'app.json',
      'metro.config.js',
      'metro.transformer.js',
    ].forEach((name) => {
      fs.copyFileSync(path.join(ROOT, name), path.join(projectDir, name))
    })
    fs.symlinkSync(
      path.join(ROOT, 'node_modules'),
      path.join(projectDir, 'node_modules'),
    )
    fs.writeFileSync(path.join(projectDir, '.env'), dotEnv)
    const script = `require('./metro.config.js')
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('EXPO_PUBLIC_')))
process.stdout.write(JSON.stringify(env))`
    const result = spawnSync(process.execPath, ['-e', script], {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
      } as unknown as NodeJS.ProcessEnv,
    })
    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`metro.config.js failed: ${result.stderr}`)
    }
    return JSON.parse(result.stdout)
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true })
  }
}

describe('Config', () => {
  it('loads .env into the bundler env, with \\$ kept as a literal $', () => {
    const env = loadBundlerEnv(
      [
        '# comment',
        'EXPO_PUBLIC_ONE_SIGNAL_ACCOUNT_TAG_SALT=\\$2a\\$10\\$abcdefghijklmnopqrstuv',
        'EXPO_PUBLIC_PRIVY_CLIENT_ID="client-\\$HOME-x"',
        "EXPO_PUBLIC_WALLET_REST_URI='https://wallet.example.com/api#frag'",
        'EXPO_PUBLIC_MAINNET_RPC_URL=https://rpc.example.com',
      ].join('\n'),
    )

    expect(env).toEqual({
      EXPO_PUBLIC_ONE_SIGNAL_ACCOUNT_TAG_SALT: '$2a$10$abcdefghijklmnopqrstuv',
      EXPO_PUBLIC_PRIVY_CLIENT_ID: 'client-$HOME-x',
      EXPO_PUBLIC_WALLET_REST_URI: 'https://wallet.example.com/api#frag',
      EXPO_PUBLIC_MAINNET_RPC_URL: 'https://rpc.example.com',
    })
  })

  it('inlines every EXPO_PUBLIC_ key into a release bundle', () => {
    const env = Object.fromEntries(
      KEYS.map((key) => [`EXPO_PUBLIC_${key}`, `value-of-${key}`]),
    )

    const code = withBuildEnv(
      env,
      () =>
        transformFileSync(path.join(ROOT, 'src', 'utils', 'config.ts'), {
          cwd: ROOT,
          root: ROOT,
          configFile: path.join(ROOT, 'babel.config.js'),
          babelrc: false,
          caller: METRO_CALLER,
        })?.code ?? '',
    )

    expect(code).not.toContain('EXPO_PUBLIC_')
    expect(code).not.toContain('expo/virtual/env')
    // The app has no build-time env at runtime, and Config needs no module
    const module = { exports: {} as { default?: Record<string, unknown> } }
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      require: (id: string) => {
        throw new Error(`Config requires ${id}`)
      },
      process: { env: {} },
    })
    const Config = module.exports.default ?? {}
    expect(Object.keys(Config).sort()).toEqual([...KEYS].sort())
    KEYS.forEach((key) => {
      expect(Config[key]).toBe(`value-of-${key}`)
    })
  })

  it('runs the worklets plugin once in a release bundle', () => {
    const options = withBuildEnv({}, () =>
      loadOptions({
        cwd: ROOT,
        root: ROOT,
        configFile: path.join(ROOT, 'babel.config.js'),
        babelrc: false,
        caller: METRO_CALLER,
        filename: path.join(ROOT, 'src', 'utils', 'config.ts'),
      }),
    )

    const { plugins } = options as { plugins: { key: string }[] }
    expect(plugins.filter(({ key }) => key === 'worklets')).toHaveLength(1)
  })

  it('is the only place the app reads a key', () => {
    const CONFIG_FILE = path.join(ROOT, 'src', 'utils', 'config.ts')
    const sourceFiles = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          return entry.name === '__tests__' ? [] : sourceFiles(file)
        }
        return /\.(js|jsx|ts|tsx)$/.test(entry.name) ? [file] : []
      })

    const reads = sourceFiles(path.join(ROOT, 'src'))
      .filter((file) => file !== CONFIG_FILE)
      .flatMap((file) => {
        const source = fs.readFileSync(file, 'utf8')
        const envReads = [...source.matchAll(/process\.env\.(\w+)/g)]
          .map(([, name]) => name)
          .filter(
            (name) => name.startsWith('EXPO_PUBLIC_') || KEYS.includes(name),
          )
        const otherReads = ['react-native-config', 'expoConfig'].filter(
          (term) => source.includes(term),
        )
        return [...envReads, ...otherReads].map(
          (read) => `${path.relative(ROOT, file)}: ${read}`,
        )
      })

    expect(reads).toEqual([])
  })
})
