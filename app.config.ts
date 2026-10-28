import { ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext) => ({
  ...config,
  android: {
    ...config.android,
    // EAS file env var: the path to the secret google-services.json.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
})
