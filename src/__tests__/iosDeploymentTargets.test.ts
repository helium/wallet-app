import path from 'path'
import { getConfig } from 'expo/config'

// SDK 55 (ExpoModulesCore) sets the iOS floor at 15.1. Prebuild writes each
// value below as IPHONEOS_DEPLOYMENT_TARGET of its Xcode target.
const IOS_FLOOR = [15, 1]

const PROJECT_ROOT = path.resolve(__dirname, '../..')

const isAtLeastFloor = (version: string) => {
  const [major, minor = 0] = version.split('.').map(Number)
  return (
    major > IOS_FLOOR[0] || (major === IOS_FLOOR[0] && minor >= IOS_FLOOR[1])
  )
}

const pluginProps = (name: string) => {
  const { exp } = getConfig(PROJECT_ROOT, { skipSDKVersionRequirement: true })
  const entry = exp.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === name,
  )
  if (!Array.isArray(entry)) throw new Error(`${name} has no props in app.json`)
  return entry[1]
}

describe('iOS deployment targets', () => {
  it('builds the app target at the SDK floor or higher', () => {
    expect(
      isAtLeastFloor(pluginProps('expo-build-properties').ios.deploymentTarget),
    ).toBe(true)
  })

  it('builds the OneSignal notification service extension at the SDK floor or higher', () => {
    expect(
      isAtLeastFloor(
        pluginProps('onesignal-expo-plugin').iPhoneDeploymentTarget,
      ),
    ).toBe(true)
  })

  it('builds the widget extension at the SDK floor or higher', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const widget = require('../../targets/HeliumWalletWidget/expo-target.config')
    expect(isAtLeastFloor(widget.deploymentTarget)).toBe(true)
  })
})
