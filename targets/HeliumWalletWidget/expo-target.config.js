/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'HeliumWalletWidgetExtension',
  displayName: 'Helium Wallet Widget',
  bundleIdentifier: '.HeliumWalletWidget',
  deploymentTarget: '15.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  // An object here, not a hand .entitlements file: the plugin parses a hand
  // file into a null-prototype object that breaks Expo config serialization.
  entitlements: {
    'com.apple.security.application-groups': [
      'group.com.helium.mobile.wallet.widget',
    ],
  },
}
