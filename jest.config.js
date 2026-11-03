const path = require('path')

// Run tests off UTC so date code that ignores the time zone fails.
process.env.TZ = 'America/Denver'

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/__tests__/**/*.test.{ts,tsx}'],
  // The first pattern that matches a file wins
  transform: {
    // Through React Compiler, as in babel.config.js: the compiled hook reads
    // memo dependencies on each render. Other suites do not pass under the
    // compiler yet.
    'src/features/governance/usePositionActions\\.tsx$': [
      'babel-jest',
      {
        configFile: false,
        presets: ['module:@react-native/babel-preset'],
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              panicThreshold: 'none',
              sources: [path.join(__dirname, 'src') + path.sep],
            },
          ],
        ],
      },
    ],
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: false, presets: ['module:@react-native/babel-preset'] },
    ],
  },
  // @noble/ed25519, react-native-mmkv and @react-navigation ship ESM only
  transformIgnorePatterns: [
    'node_modules/(?!(@noble/ed25519|react-native-mmkv|@react-navigation/(core|routers))/)',
  ],
}
