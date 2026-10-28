import Constants from 'expo-constants'

// Every key must also be listed in app.config.ts `extra`, which embeds it
// into the native build.
export const CONFIG_KEYS = [
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
] as const

type ConfigKey = (typeof CONFIG_KEYS)[number]

if (!Constants.expoConfig) {
  console.warn(
    'Embedded app config is missing; every Config key reads undefined',
  )
}

const extra: Record<string, unknown> = Constants.expoConfig?.extra ?? {}

// A key missing from the build reads as undefined. The type keeps the
// `string` contract of react-native-config, which this module replaces.
const Config = Object.fromEntries(
  CONFIG_KEYS.map((key) => {
    const value = extra[key]
    return [key, typeof value === 'string' ? value : undefined]
  }),
) as Record<ConfigKey, string>

export default Config
