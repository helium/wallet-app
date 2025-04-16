const { getDefaultConfig } = require('@expo/metro-config')
const { mergeConfig } = require('@react-native/metro-config')
const defaultSourceExts =
  require('metro-config/src/defaults/defaults').sourceExts
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */


module.exports = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: defaultAssetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultSourceExts, 'svg', 'cjs', 'mjs'],
  },
})
