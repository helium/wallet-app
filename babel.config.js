function getAliasesFromTsConfig() {
  const tsConfig = require('./tsconfig.json')
  const paths = tsConfig.compilerOptions.paths
  let alias = {}
  Object.keys(paths).forEach((key) => {
    alias[key] = `./${paths[key][0]}`
  })

  return alias
}

module.exports = (api) => {
  api.cache(true)

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
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
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          root: ['./src'],
        },
      ],
      'react-native-reanimated/plugin',
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
