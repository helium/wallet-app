const { getDefaultConfig } = require('expo/metro-config')

const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
}

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: [...assetExts.filter((ext) => ext !== 'svg'), 'lottie', 'ico'],
  sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
}

module.exports = defaultConfig
