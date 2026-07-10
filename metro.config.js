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

// Resolve `pkg` (and its subpaths) to this app's single node_modules copy so
// hoisted duplicates collapse to one module instance (see SINGLE_COPY_PKGS).
const forceSingleCopy = (context, moduleName, platform, pkg) => {
  const suffix = moduleName.replace(pkg, '')
  const resolved = path.resolve(__dirname, 'node_modules/' + pkg + suffix)
  return context.resolveRequest(
    { ...context, resolveRequest: undefined },
    resolved,
    platform,
  )
}

// Packages that must resolve to this app's single node_modules copy (see below).
const SINGLE_COPY_PKGS = ['@tanstack/react-query', '@privy-io/expo']

// Dedups @tanstack/react-query, @privy-io/expo, and jose to a single copy so Privy/Solana
// providers share one module instance (avoids duplicate React contexts); revisit if those
// upstream deps stop requiring a forced single resolution.
defaultConfig.resolver = {
  ...defaultConfig.resolver,
  assetExts: [...assetExts.filter((ext) => ext !== 'svg'), 'lottie', 'ico'],
  sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
  resolveRequest: (context, moduleName, platform) => {
    const singleCopyPkg = SINGLE_COPY_PKGS.find(
      (p) => moduleName === p || moduleName.startsWith(`${p}/`),
    )
    if (singleCopyPkg) {
      return forceSingleCopy(context, moduleName, platform, singleCopyPkg)
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
