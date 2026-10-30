// Run tests off UTC so date code that ignores the time zone fails.
process.env.TZ = 'America/Denver'

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: false, presets: ['module:@react-native/babel-preset'] },
    ],
  },
  // @noble/ed25519 and react-native-mmkv ship ESM only
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|react-native-mmkv)/)',
  ],
}
