// eslint-disable-next-line @typescript-eslint/no-var-requires
const withHeliumNative = require('../../plugins/withHeliumNative')

const { addPodPostInstall } = withHeliumNative

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
  })
})
