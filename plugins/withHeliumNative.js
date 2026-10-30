// Native settings that no app config field or library plugin covers.
// Each one mirrors a hand edit in the bare ios/ and android/ projects.
const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
  withGradleProperties,
  withPodfile,
} = require('expo/config-plugins')

const POD_POST_INSTALL = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"
        config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', '_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION']
        # Raise pods (resource bundles among them) below the app's iOS floor.
        pod_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        app_target = podfile_properties['ios.deploymentTarget']
        if pod_target && Gem::Version.new(pod_target) < Gem::Version.new(app_target)
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = app_target
        end
      end
    end
`

const POD_POST_INSTALL_ANCHOR = 'post_install do |installer|'

const addPodPostInstall = (contents) => {
  if (contents.includes('ONLY_ACTIVE_ARCH')) {
    return contents
  }
  if (!contents.includes(POD_POST_INSTALL_ANCHOR)) {
    throw new Error(
      'withHeliumNative: Podfile has no "post_install do |installer|" block',
    )
  }
  return contents.replace(
    POD_POST_INSTALL_ANCHOR,
    `${POD_POST_INSTALL_ANCHOR}${POD_POST_INSTALL}`,
  )
}

const withPodPostInstall = (config) =>
  withPodfile(config, (cfg) => {
    cfg.modResults.contents = addPodPostInstall(cfg.modResults.contents)
    return cfg
  })

const GRADLE_PROPERTIES = {
  'org.gradle.jvmargs': '-Xmx8192m -XX:MaxMetaspaceSize=1024m',
  'android.enableJetifier': 'true',
  'android.suppressUnsupportedCompileSdk': '37',
}

const withHeliumGradleProperties = (config) =>
  withGradleProperties(config, (cfg) => {
    Object.entries(GRADLE_PROPERTIES).forEach(([key, value]) => {
      const item = cfg.modResults.find(
        (entry) => entry.type === 'property' && entry.key === key,
      )
      if (item) {
        item.value = value
      } else {
        cfg.modResults.push({ type: 'property', key, value })
      }
    })
    return cfg
  })

const upsert = (list, name, attrs) => {
  const item = list.find((entry) => entry.$['android:name'] === name)
  if (item) {
    Object.assign(item.$, attrs)
  } else {
    list.push({ $: { 'android:name': name, ...attrs } })
  }
}

const withHeliumManifest = (config) =>
  withAndroidManifest(config, (cfg) => {
    const { manifest } = cfg.modResults
    AndroidConfig.Manifest.ensureToolsAvailable(cfg.modResults)

    manifest['uses-permission'] = manifest['uses-permission'] || []
    upsert(manifest['uses-permission'], 'android.permission.BLUETOOTH_SCAN', {
      'android:usesPermissionFlags': 'neverForLocation',
      'tools:targetApi': 's',
    })

    manifest['uses-feature'] = manifest['uses-feature'] || []
    upsert(manifest['uses-feature'], 'android.hardware.bluetooth_le', {
      'android:required': 'true',
    })
    upsert(manifest['uses-feature'], 'android.hardware.camera', {
      'android:required': 'false',
    })

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults)
    app.$['android:largeHeap'] = 'true'
    app.$['tools:replace'] = 'android:allowBackup'
    return cfg
  })

// The refresh is light only, so native chrome (dialogs, pickers)
// stays light even over legacy dark screens until they migrate. The template's
// DayNight theme would follow the system dark mode.
const withLightAppTheme = (config) =>
  withAndroidStyles(config, (cfg) => {
    const appTheme = cfg.modResults.resources.style?.find(
      (style) => style.$.name === 'AppTheme',
    )
    if (!appTheme) {
      throw new Error('withHeliumNative: styles.xml has no AppTheme style')
    }
    appTheme.$.parent = 'Theme.AppCompat.Light.NoActionBar'
    return cfg
  })

module.exports = (config) =>
  withLightAppTheme(
    withHeliumManifest(withHeliumGradleProperties(withPodPostInstall(config))),
  )

module.exports.addPodPostInstall = addPodPostInstall
