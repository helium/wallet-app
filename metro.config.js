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

// Resolve to an absolute target path, bypassing our own resolveRequest hook.
const resolveTo = (context, platform, targetPath) =>
  context.resolveRequest(
    { ...context, resolveRequest: undefined },
    targetPath,
    platform,
  )

// Resolve `pkg` (and its subpaths) to this app's single node_modules copy so
// hoisted duplicates collapse to one module instance (see SINGLE_COPY_PKGS).
const forceSingleCopy = (context, moduleName, platform, pkg, target = pkg) => {
  const suffix = moduleName.replace(pkg, '')
  const resolved = path.resolve(__dirname, 'node_modules/' + target + suffix)
  return resolveTo(context, platform, resolved)
}

// Packages that must resolve to this app's single node_modules copy (see below).
const SINGLE_COPY_PKGS = [
  '@tanstack/react-query',
  '@privy-io/expo',
  '@anchor-lang/core',
]

// package.json aliases @coral-xyz/anchor@^0.31.0 to @anchor-lang/core, but the
// node-modules linker installs the alias as a second copy. Send it to the
// @anchor-lang/core copy so both names share one module instance. Pyth needs
// anchor 0.29 and keeps its own nested copy.
const ANCHOR_ALIAS = '@coral-xyz/anchor'
const isAnchorAliasRequest = (context, moduleName) =>
  (moduleName === ANCHOR_ALIAS || moduleName.startsWith(`${ANCHOR_ALIAS}/`)) &&
  !context.originModulePath.includes('/node_modules/@pythnetwork/')

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
    if (isAnchorAliasRequest(context, moduleName)) {
      return forceSingleCopy(
        context,
        moduleName,
        platform,
        ANCHOR_ALIAS,
        '@anchor-lang/core',
      )
    }
    // Redirect jose to its browser build (avoids Node.js 'https' dependency)
    if (moduleName === 'jose' || moduleName.startsWith('jose/')) {
      const browserPath = moduleName.replace(
        /^jose/,
        path.resolve(__dirname, 'node_modules/jose/dist/browser'),
      )
      return resolveTo(context, platform, browserPath)
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform)
    }
    return resolveTo(context, platform, moduleName)
  },
}

module.exports = defaultConfig
