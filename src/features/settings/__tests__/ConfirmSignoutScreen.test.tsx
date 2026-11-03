import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ConfirmSignoutScreen from '../ConfirmSignoutScreen'

declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockAlert = jest.fn()

jest.mock('react-native', () => ({
  // read at call time: the import of the screen runs before mockAlert is set
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: () => {}, popToTop: () => {} }),
}))
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: jest.fn() }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('../../onboarding/create/ConfirmWordsScreen', () => ({
  __esModule: true,
  default: 'ConfirmWordsScreen',
}))
jest.mock('../../../storage/AccountStorageProvider', () => {
  const storage = {
    currentAccount: { alias: 'Main', address: 'main' },
    accounts: {
      main: { alias: 'Main', address: 'main' },
      other: { alias: 'Other', address: 'other' },
    },
    signOut: jest.fn(),
  }
  return { useAccountStorage: () => storage }
})
jest.mock('../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ pin: undefined }),
}))
jest.mock('../../../storage/secureStorage', () => ({
  getSecureAccount: async () => ({ mnemonic: ['word'] }),
}))

describe('ConfirmSignoutScreen', () => {
  it('warns an iOS user that sign-out reaches other devices on the same iCloud account', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    // async act flushes the read of the recovery words
    await act(async () => {
      renderer = TestRenderer.create(<ConfirmSignoutScreen />)
    })
    if (!renderer) throw new Error('render failed')

    act(() => {
      renderer?.root
        .findByType('ConfirmWordsScreen' as never)
        .props.onComplete()
    })

    expect(mockAlert).toHaveBeenCalledTimes(1)
    expect(mockAlert.mock.calls[0][1]).toBe(
      'settings.sections.account.signOutAlert.body' +
        'settings.sections.account.signOutAlert.iCloudMessageOneWallet',
    )
  })
})
