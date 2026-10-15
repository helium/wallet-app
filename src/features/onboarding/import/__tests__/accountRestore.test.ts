import { Keypair } from '@solana/web3.js'
import type { CSAccount, CSAccounts } from '../../../../storage/cloudStorage'
import { matchRestoredAccounts } from '../accountRestore'

const DEFAULT_PATH = "m/44'/501'/0'/0'"
const SUB_ACCOUNT_PATH = "m/44'/501'/3'/0'"
const FAR_SUB_ACCOUNT_PATH = "m/44'/501'/40'/0'"

// One seed: a fixed keypair per path, null for any path it cannot derive
const seedWith = (paths: string[]) => {
  const keys = new Map(paths.map((p) => [p, Keypair.generate()]))
  return {
    key: (path: string) => keys.get(path) as Keypair,
    derive: async (path: string) => keys.get(path) ?? null,
  }
}

const account = (
  address: string,
  keypair: Keypair,
  extra: Partial<CSAccount> = {},
): CSAccount =>
  ({
    alias: address,
    address,
    solanaAddress: keypair.publicKey.toBase58(),
    netType: 0,
    ...extra,
  } as CSAccount)

const byAddress = (...accts: CSAccount[]): CSAccounts =>
  Object.fromEntries(accts.map((a) => [a.address, a]))

describe('matchRestoredAccounts', () => {
  it('restores a default-path account with no stored derivation path', async () => {
    const seed = seedWith([DEFAULT_PATH])
    const accounts = byAddress(account('a', seed.key(DEFAULT_PATH)))

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored).toHaveLength(1)
    expect(restored[0].account.address).toBe('a')
    expect(restored[0].derivationPath).toBe(DEFAULT_PATH)
    expect(restored[0].keypair.publicKey.toBase58()).toBe(
      seed.key(DEFAULT_PATH).publicKey.toBase58(),
    )
  })

  it('restores a sub-account with no stored derivation path', async () => {
    const seed = seedWith([SUB_ACCOUNT_PATH])
    const accounts = byAddress(account('a', seed.key(SUB_ACCOUNT_PATH)))

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored.map((r) => r.derivationPath)).toEqual([SUB_ACCOUNT_PATH])
  })

  it('uses a stored derivation path outside the scan range', async () => {
    const seed = seedWith([FAR_SUB_ACCOUNT_PATH])
    const accounts = byAddress(
      account('a', seed.key(FAR_SUB_ACCOUNT_PATH), {
        derivationPath: FAR_SUB_ACCOUNT_PATH,
      }),
    )

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored.map((r) => r.derivationPath)).toEqual([
      FAR_SUB_ACCOUNT_PATH,
    ])
  })

  it('falls back to the scan when the stored derivation path is wrong', async () => {
    const seed = seedWith([DEFAULT_PATH])
    const accounts = byAddress(
      account('a', seed.key(DEFAULT_PATH), { derivationPath: 'Helium L1' }),
    )

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored.map((r) => r.derivationPath)).toEqual([DEFAULT_PATH])
  })

  it('restores every listed account the words hold a key for, target first', async () => {
    const seed = seedWith([DEFAULT_PATH, SUB_ACCOUNT_PATH])
    const other = Keypair.generate()
    const accounts = byAddress(
      account('sibling', seed.key(SUB_ACCOUNT_PATH)),
      account('unrelated', other),
      account('a', seed.key(DEFAULT_PATH)),
    )

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored.map((r) => r.account.address)).toEqual(['a', 'sibling'])
  })

  it('never restores a software key onto a hardware wallet account', async () => {
    const seed = seedWith([DEFAULT_PATH, SUB_ACCOUNT_PATH])
    const accounts = byAddress(
      account('a', seed.key(DEFAULT_PATH)),
      account('keystone', seed.key(SUB_ACCOUNT_PATH), {
        keystoneDevice: { masterFingerprint: 'f', device: 'd' },
      }),
      account('ledger', seed.key(SUB_ACCOUNT_PATH), {
        ledgerDevice: { id: 'l', name: 'l', type: 'bluetooth' },
      }),
    )

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored.map((r) => r.account.address)).toEqual(['a'])
  })

  it('restores nothing when the words do not hold the key for the target', async () => {
    const seed = seedWith([DEFAULT_PATH, SUB_ACCOUNT_PATH])
    const accounts = byAddress(
      account('a', Keypair.generate()),
      account('sibling', seed.key(SUB_ACCOUNT_PATH)),
    )

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'a',
      derive: seed.derive,
    })

    expect(restored).toEqual([])
  })

  it('restores nothing for an address the wallet does not list', async () => {
    const seed = seedWith([DEFAULT_PATH])
    const accounts = byAddress(account('a', seed.key(DEFAULT_PATH)))

    const restored = await matchRestoredAccounts({
      accounts,
      accountAddress: 'missing',
      derive: seed.derive,
    })

    expect(restored).toEqual([])
  })
})
