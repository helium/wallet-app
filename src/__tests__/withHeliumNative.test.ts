import path from 'path'
import { getConfig } from 'expo/config'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withHeliumNative = require('../../plugins/withHeliumNative')

const { addPodPostInstall } = withHeliumNative

const PROJECT_ROOT = path.resolve(__dirname, '../..')

const ANCHOR = 'post_install do |installer|'

const PODFILE = `target 'HeliumWallet' do
  use_react_native!

  ${ANCHOR}
    react_native_post_install(installer)
  end
end
`

describe('addPodPostInstall', () => {
  it('inserts the build settings right after the post_install anchor', () => {
    const result: string = addPodPostInstall(PODFILE)
    const start = result.indexOf(ANCHOR) + ANCHOR.length
    expect(
      result
        .slice(start)
        .startsWith('\n    installer.pods_project.targets.each do |target|'),
    ).toBe(true)
    expect(result).toContain('config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"')
    expect(result.indexOf('ONLY_ACTIVE_ARCH')).toBeLessThan(
      result.indexOf('react_native_post_install(installer)'),
    )
  })

  it('returns the same string on a second call', () => {
    const once: string = addPodPostInstall(PODFILE)
    expect(addPodPostInstall(once)).toBe(once)
  })

  it('throws when the Podfile has no post_install block', () => {
    expect(() =>
      addPodPostInstall("target 'HeliumWallet' do\n  use_react_native!\nend\n"),
    ).toThrow(
      'withHeliumNative: Podfile has no "post_install do |installer|" block',
    )
  })
})

describe('withHeliumNative', () => {
  it('adds the build settings to the Podfile through the podfile mod', async () => {
    const config = withHeliumNative({
      name: 'x',
      slug: 'x',
      ios: {},
      android: {},
    })
    const result = await config.mods.ios.podfile({
      ...config,
      modResults: { contents: PODFILE },
      modRequest: {
        nextMod: async (c: unknown) => c,
        platform: 'ios',
        modName: 'podfile',
        projectRoot: '/tmp',
        platformProjectRoot: '/tmp/ios',
        introspect: false,
      },
    })
    expect(result.modResults.contents).toContain(
      'config.build_settings["ONLY_ACTIVE_ARCH"] = "NO"',
    )
    expect(result.modResults.contents).toContain(
      "if pod_target && Gem::Version.new(pod_target) < Gem::Version.new(app_target)\n          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = app_target",
    )
  })

  it('suppresses the unsupported compileSdk warning at the app compileSdk', async () => {
    const { exp } = getConfig(PROJECT_ROOT, { skipSDKVersionRequirement: true })
    const buildProperties = exp.plugins?.find(
      (plugin) =>
        Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
    )
    if (!Array.isArray(buildProperties))
      throw new Error('expo-build-properties has no props in app.json')
    const config = withHeliumNative({
      name: 'x',
      slug: 'x',
      ios: {},
      android: {},
    })
    const result = await config.mods.android.gradleProperties({
      ...config,
      modResults: [],
      modRequest: {
        nextMod: async (c: unknown) => c,
        platform: 'android',
        modName: 'gradleProperties',
        projectRoot: '/tmp',
        platformProjectRoot: '/tmp/android',
        introspect: false,
      },
    })
    expect(result.modResults).toContainEqual({
      type: 'property',
      key: 'android.suppressUnsupportedCompileSdk',
      value: String(buildProperties[1].android.compileSdkVersion),
    })
  })

  const runStylesMod = (resources: unknown) => {
    const config = withHeliumNative({
      name: 'x',
      slug: 'x',
      ios: {},
      android: {},
    })
    return config.mods.android.styles({
      ...config,
      modResults: { resources },
      modRequest: {
        nextMod: async (c: unknown) => c,
        platform: 'android',
        modName: 'styles',
        projectRoot: '/tmp',
        platformProjectRoot: '/tmp/android',
        introspect: false,
      },
    })
  }

  it('sets the AppTheme parent to the light theme through the styles mod', async () => {
    const result = await runStylesMod({
      style: [
        {
          $: {
            name: 'AppTheme',
            parent: 'Theme.AppCompat.DayNight.NoActionBar',
          },
          item: [],
        },
      ],
    })
    expect(result.modResults.resources.style[0].$.parent).toBe(
      'Theme.AppCompat.Light.NoActionBar',
    )
  })

  it.each([
    ['an empty style list', { style: [] }],
    ['no style list', {}],
  ])('rejects a styles file with %s', async (_label, resources) => {
    await expect(runStylesMod(resources)).rejects.toThrow(
      'withHeliumNative: styles.xml has no AppTheme style',
    )
  })
})
