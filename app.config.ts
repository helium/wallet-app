import fs from 'fs'
import path from 'path'
import { ConfigContext } from 'expo/config'

// Values come from .env only, parsed with react-native-config's grammar:
// spaces around `=` and trailing spaces are ignored, surrounding quotes are
// stripped, and `$` and `#` are kept literally. The shell env and .env.local
// are not read. A malformed line fails the build.
const readDotEnv = (projectRoot: string): Record<string, string> => {
  const file = path.join(projectRoot, '.env')
  if (!fs.existsSync(file)) {
    console.warn(`Missing .env at ${file}; every config value is undefined`)
    return {}
  }
  const env: Record<string, string> = {}
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (!line.trim() || /^\s*#/.test(line)) return
      const match = line.match(
        /^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/,
      )
      if (!match) {
        throw new Error(`Invalid entry in .env at line ${index + 1}`)
      }
      const [, key, raw] = match
      const quote = raw[0]
      if (quote !== "'" && quote !== '"') {
        env[key] = raw
        return
      }
      const unquoted = raw.slice(1)
      env[key] = unquoted.endsWith(quote) ? unquoted.slice(0, -1) : unquoted
    })
  return env
}

export default ({ config, projectRoot }: ConfigContext) => {
  const env = readDotEnv(projectRoot)
  return {
    ...config,
    extra: {
      ...config.extra,
      MAINNET_RPC_URL: env.MAINNET_RPC_URL,
      DEVNET_RPC_URL: env.DEVNET_RPC_URL,
      MAINNET_HELIUM_TRANSACTION_API: env.MAINNET_HELIUM_TRANSACTION_API,
      DEVNET_HELIUM_TRANSACTION_API: env.DEVNET_HELIUM_TRANSACTION_API,
      ONBOARDING_API_URL: env.ONBOARDING_API_URL,
      WALLET_REST_URI: env.WALLET_REST_URI,
      MIGRATION_SERVER_URL: env.MIGRATION_SERVER_URL,
      TOKENS_TO_RENT_SERVICE_URL: env.TOKENS_TO_RENT_SERVICE_URL,
      TOKENS_TO_RENT_SERVICE_DEVNET_URL: env.TOKENS_TO_RENT_SERVICE_DEVNET_URL,
      PMTILES_URL: env.PMTILES_URL,
      ONE_SIGNAL_APP_ID: env.ONE_SIGNAL_APP_ID,
      ONE_SIGNAL_ACCOUNT_TAG_SALT: env.ONE_SIGNAL_ACCOUNT_TAG_SALT,
      WALLET_CONNECT_PROJECT_ID: env.WALLET_CONNECT_PROJECT_ID,
      WALLET_CONNECT_METADATA_URL: env.WALLET_CONNECT_METADATA_URL,
      HELIUM_VOTE_API_URL: env.HELIUM_VOTE_API_URL,
      DEVNET_HELIUM_VOTE_API_URL: env.DEVNET_HELIUM_VOTE_API_URL,
      PRIVY_APP_ID: env.PRIVY_APP_ID,
      PRIVY_CLIENT_ID: env.PRIVY_CLIENT_ID,
      LOG_ANIMATIONS: env.LOG_ANIMATIONS,
      LOG_BREADCRUMBS: env.LOG_BREADCRUMBS,
      OVERRIDE_MODEL_ID: env.OVERRIDE_MODEL_ID,
      OVERRIDE_WIRED: env.OVERRIDE_WIRED,
      VIEW_AS: env.VIEW_AS,
    },
  }
}
