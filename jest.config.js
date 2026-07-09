module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/features/migration/logic/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: false, presets: ['module:@react-native/babel-preset'] },
    ],
  },
}
