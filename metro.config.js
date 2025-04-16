const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig: getDefaultExpoConfig } = require('expo/metro-config')
const defaultSourceExts =
  require('metro-config/src/defaults/defaults').sourceExts
const defaultAssetExts = require('metro-config/src/defaults/defaults').assetExts
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

/** @type {import('expo/metro-config').MetroConfig} */
const expoConfig = getDefaultExpoConfig(__dirname);
const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, expoConfig, {
  transformer: {
    ...expoConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    ...expoConfig.resolver,
    assetExts: defaultAssetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultSourceExts, 'svg', 'cjs', 'mjs'],
  },
})
