import { ConfigContext } from 'expo/config'

// Build environment values the app reads through src/utils/config.ts.
// expo-constants embeds this config into both native builds.
export default ({ config }: ConfigContext) => ({
  ...config,
  extra: {
    ...config.extra,
    MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
    DEVNET_RPC_URL: process.env.DEVNET_RPC_URL,
    MAINNET_HELIUM_TRANSACTION_API: process.env.MAINNET_HELIUM_TRANSACTION_API,
    DEVNET_HELIUM_TRANSACTION_API: process.env.DEVNET_HELIUM_TRANSACTION_API,
    ONBOARDING_API_URL: process.env.ONBOARDING_API_URL,
    WALLET_REST_URI: process.env.WALLET_REST_URI,
    MIGRATION_SERVER_URL: process.env.MIGRATION_SERVER_URL,
    TOKENS_TO_RENT_SERVICE_URL: process.env.TOKENS_TO_RENT_SERVICE_URL,
    TOKENS_TO_RENT_SERVICE_DEVNET_URL:
      process.env.TOKENS_TO_RENT_SERVICE_DEVNET_URL,
    PMTILES_URL: process.env.PMTILES_URL,
    ONE_SIGNAL_APP_ID: process.env.ONE_SIGNAL_APP_ID,
    ONE_SIGNAL_ACCOUNT_TAG_SALT: process.env.ONE_SIGNAL_ACCOUNT_TAG_SALT,
    WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID,
    WALLET_CONNECT_METADATA_URL: process.env.WALLET_CONNECT_METADATA_URL,
    HELIUM_VOTE_API_URL: process.env.HELIUM_VOTE_API_URL,
    DEVNET_HELIUM_VOTE_API_URL: process.env.DEVNET_HELIUM_VOTE_API_URL,
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
    PRIVY_CLIENT_ID: process.env.PRIVY_CLIENT_ID,
    LOG_ANIMATIONS: process.env.LOG_ANIMATIONS,
    LOG_BREADCRUMBS: process.env.LOG_BREADCRUMBS,
    OVERRIDE_MODEL_ID: process.env.OVERRIDE_MODEL_ID,
    OVERRIDE_WIRED: process.env.OVERRIDE_WIRED,
    VIEW_AS: process.env.VIEW_AS,
  },
})
