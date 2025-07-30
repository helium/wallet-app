const { getDefaultConfig } = require('@react-native/metro-config')
const { mergeConfig } = require('@react-native/metro-config')

const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
    // Prefer browser field over node field
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'web'],
  },
}

module.exports = mergeConfig(defaultConfig, config)
