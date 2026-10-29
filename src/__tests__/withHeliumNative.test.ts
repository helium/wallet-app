// eslint-disable-next-line @typescript-eslint/no-var-requires
const { addPodPostInstall } = require('../../plugins/withHeliumNative')

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
