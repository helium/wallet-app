module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: false, presets: ['module:@react-native/babel-preset'] },
    ],
  },
  // @noble/ed25519 ships ESM only
  transformIgnorePatterns: ['node_modules/(?!@noble/ed25519/)'],
}
