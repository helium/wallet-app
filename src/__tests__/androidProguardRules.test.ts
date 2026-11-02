import fs from 'fs'
import os from 'os'
import path from 'path'
import { getConfig } from 'expo/config'
import withBuildProperties from 'expo-build-properties'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

// Prebuild runs the expo-build-properties dangerous mod, which appends the
// app.json extraProguardRules to android/app/proguard-rules.pro.
const generateProguardRules = async () => {
  const { exp } = getConfig(PROJECT_ROOT, { skipSDKVersionRequirement: true })
  const entry = exp.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
  )
  if (!Array.isArray(entry))
    throw new Error('expo-build-properties has no props in app.json')
  const platformProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'android-'))
  const rulesFile = path.join(platformProjectRoot, 'app', 'proguard-rules.pro')
  fs.mkdirSync(path.dirname(rulesFile))
  fs.writeFileSync(rulesFile, '# Add project specific ProGuard rules here.\n')
  const config = withBuildProperties({ name: 'x', slug: 'x' }, entry[1])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (config as any).mods.android.dangerous({
    ...config,
    modResults: {},
    modRequest: {
      nextMod: async (c: unknown) => c,
      platform: 'android',
      modName: 'dangerous',
      projectRoot: PROJECT_ROOT,
      platformProjectRoot,
      introspect: false,
    },
  })
  return fs.readFileSync(rulesFile, 'utf8')
}

describe('Android proguard-rules.pro', () => {
  it('lets R8 skip java.awt.Component, which JNA references and Android lacks', async () => {
    const lines = (await generateProguardRules()).split('\n')
    expect(lines).toContain('-dontwarn java.awt.Component')
  })
})
