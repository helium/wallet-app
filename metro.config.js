const path = require('path')
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

const originalResolveRequest = defaultConfig.resolver.resolveRequest

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: [...assetExts.filter((ext) => ext !== 'svg'), 'lottie', 'ico'],
  sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
  resolveRequest: (context, moduleName, platform) => {
    // Force single copy of @tanstack/react-query to avoid duplicate contexts
    if (
      moduleName === '@tanstack/react-query' ||
      moduleName.startsWith('@tanstack/react-query/')
    ) {
      const suffix = moduleName.replace('@tanstack/react-query', '')
      const resolved = path.resolve(
        __dirname,
        'node_modules/@tanstack/react-query' + suffix,
      )
      return context.resolveRequest(
        { ...context, resolveRequest: undefined },
        resolved,
        platform,
      )
    }
    // Force single copy of @privy-io/expo to avoid duplicate contexts
    if (
      moduleName === '@privy-io/expo' ||
      moduleName.startsWith('@privy-io/expo/')
    ) {
      const suffix = moduleName.replace('@privy-io/expo', '')
      const resolved = path.resolve(
        __dirname,
        'node_modules/@privy-io/expo' + suffix,
      )
      return context.resolveRequest(
        { ...context, resolveRequest: undefined },
        resolved,
        platform,
      )
    }
    // Redirect jose to its browser build (avoids Node.js 'https' dependency)
    if (moduleName === 'jose' || moduleName.startsWith('jose/')) {
      const browserPath = moduleName.replace(
        /^jose/,
        path.resolve(__dirname, 'node_modules/jose/dist/browser'),
      )
      return context.resolveRequest(
        { ...context, resolveRequest: undefined },
        browserPath,
        platform,
      )
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform)
    }
    return context.resolveRequest(
      { ...context, resolveRequest: undefined },
      moduleName,
      platform,
    )
  },
}

module.exports = defaultConfig
