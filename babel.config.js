const path = require('path')

// The compiler matches `sources` entries as substrings of the file path.
const appSource = path.join(__dirname, 'src') + path.sep

module.exports = (api) => {
  api.cache(true)

  return {
    // reanimated: false, as the worklets plugin is listed below
    presets: [['babel-preset-expo', { reanimated: false }]],
    plugins: [
      // The compiler must run first. A component it cannot compile is left
      // as written.
      [
        'babel-plugin-react-compiler',
        { panicThreshold: 'none', sources: [appSource] },
      ],
      [
        'module-resolver',
        {
          alias: {
            crypto: 'react-native-quick-crypto',
            stream: 'stream-browserify',
            buffer: 'buffer',
            zlib: 'browserify-zlib',

            // This needs to be mirrored in tsconfig.json
            '@helium/crypto': './node_modules/@helium/crypto-react-native',
            '@assets': './src/assets',
            '@components': './src/components',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@storage': './src/storage',
            '@types': './src/types',
            '@ui': './src/ui',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
    env: {
      // Uncomment if you want to remove all logs in development
      // development: {
      //   plugins: ['transform-remove-console'],
      // },
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  }
}
