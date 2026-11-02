import fs from 'fs'
import path from 'path'

// @walletconnect/react-native-compat requires each of its peers at load time.
// A missing one logs "<peer> is not available" and LogBox shows a toast before
// onboarding.
const PROJECT_ROOT = path.resolve(__dirname, '../..')

const readJson = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8'))

describe('WalletConnect react-native-compat peers', () => {
  it('lists every required peer as an app dependency', () => {
    const compat = readJson(
      'node_modules/@walletconnect/react-native-compat/package.json',
    )
    const { dependencies } = readJson('package.json')
    const optional = compat.peerDependenciesMeta ?? {}
    const required = Object.keys(compat.peerDependencies).filter(
      (peer) => !optional[peer]?.optional,
    )
    expect(required.filter((peer) => !dependencies[peer])).toEqual([])
  })
})
