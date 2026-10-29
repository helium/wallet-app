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

const body = 'You are removing your only wallet.'

describe('withICloudSignOutWarning', () => {
  it('tells an iOS user that other devices on the same iCloud account are signed out', () => {
    Platform.OS = 'ios'

    expect(withICloudSignOutWarning(t, body)).toBe(
      `${body}\n\nAny device using the same iCloud account will also be signed out.`,
    )
  })

  it('leaves the Android message unchanged', () => {
    Platform.OS = 'android'

    expect(withICloudSignOutWarning(t, body)).toBe(body)
  })
})
