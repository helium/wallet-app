import Address, { KeyTypes, NetTypes } from '@helium/address'
import { Keypair } from '@solana/web3.js'
import { accountSolanaAddress } from '../accountSolanaAddress'

const VIEW_AS = 'ViewAsWa11et1111111111111111111111111111111'

jest.mock('../../utils/config', () => ({
  __esModule: true,
  default: { VIEW_AS: 'ViewAsWa11et1111111111111111111111111111111' },
}))

// Native module that accountUtils imports; the address conversion never uses it
jest.mock('bcrypt-react-native', () => ({}))

const setDevBuild = (dev: boolean) => Object.assign(global, { __DEV__: dev })

describe('accountSolanaAddress', () => {
  const keypair = Keypair.generate()
  const heliumAddress = new Address(
    0,
    NetTypes.MAINNET,
    KeyTypes.ED25519_KEY_TYPE,
    keypair.publicKey.toBytes(),
  ).b58

  it('uses the real account address in a release build, even with VIEW_AS set', () => {
    setDevBuild(false)

    expect(accountSolanaAddress(heliumAddress)).toBe(
      keypair.publicKey.toBase58(),
    )
  })

  it('uses VIEW_AS in a dev build', () => {
    setDevBuild(true)

    expect(accountSolanaAddress(heliumAddress)).toBe(VIEW_AS)
  })
})
