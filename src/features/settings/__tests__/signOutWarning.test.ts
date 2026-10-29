import { Platform } from 'react-native'
import type { TFunction } from 'i18next'
import en from '../../../locales/en'
import { withICloudSignOutWarning } from '../signOutWarning'

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

const t = ((key: string) =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)[part],
      en,
    )) as unknown as TFunction

const body = 'You are removing your wallet.'

describe('withICloudSignOutWarning', () => {
  it('tells an iOS user who removes every wallet that other devices on the same iCloud account are signed out', () => {
    Platform.OS = 'ios'

    expect(withICloudSignOutWarning(t, body, 'allWallets')).toBe(
      `${body}\n\nAny device using the same iCloud account will also be signed out.`,
    )
  })

  it('tells an iOS user who removes one wallet that other devices on the same iCloud account lose only that wallet', () => {
    Platform.OS = 'ios'

    expect(withICloudSignOutWarning(t, body, 'oneWallet')).toBe(
      `${body}\n\nThis wallet will also be removed from any device using the same iCloud account.`,
    )
  })

  it('leaves the Android message unchanged', () => {
    Platform.OS = 'android'

    expect(withICloudSignOutWarning(t, body, 'allWallets')).toBe(body)
    expect(withICloudSignOutWarning(t, body, 'oneWallet')).toBe(body)
  })
})
