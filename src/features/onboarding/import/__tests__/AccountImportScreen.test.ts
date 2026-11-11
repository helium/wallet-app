import React from 'react'
import TestRenderer, { act, ReactTestRenderer } from 'react-test-renderer'
import AccountImportScreen from '../AccountImportScreen'
import PassphraseAutocomplete from '../PassphraseAutocomplete'
import { matchRestoredAccounts } from '../accountRestore'
import { mnemonicDeriver } from '../../../../storage/secureStorage'

// jest.config.js transforms with configFile: false, so the babel aliases do
// not resolve here. The alias imports are virtual mocks.
jest.mock('@assets/images/close.svg', () => 'Close', { virtual: true })
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('@components/Text', () => 'Text', { virtual: true })
jest.mock('@components/TouchableOpacityBox', () => 'TouchableOpacityBox', {
  virtual: true,
})
jest.mock('@hooks/useAlert', () => () => ({ showOKAlert: jest.fn() }), {
  virtual: true,
})
jest.mock(
  '@theme/themeHooks',
  () => ({ useColors: () => ({}), usePaddingStyle: () => ({}) }),
  { virtual: true },
)
jest.mock('react-native', () => ({ FlatList: 'FlatList' }))
jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockNavigation = {
  addListener: jest.fn(() => () => {}),
  navigate: jest.fn(),
  popToTop: jest.fn(),
}
let mockRouteParams: Record<string, unknown> = {}
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockRouteParams }),
}))

const mockRestoreSecureAccounts = jest.fn(() => Promise.resolve())
jest.mock('../../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    restoreSecureAccounts: mockRestoreSecureAccounts,
    hasAccounts: true,
    accounts: {},
  }),
}))
jest.mock('../../../../storage/secureStorage', () => ({
  mnemonicDeriver: jest.fn(),
  toSecureAccount: jest.fn(() => ({})),
}))
const mockSetOnboardingData = jest.fn()
jest.mock('../../OnboardingProvider', () => ({
  useOnboarding: () => ({
    setOnboardingData: mockSetOnboardingData,
    reset: jest.fn(),
  }),
}))
jest.mock('../PassphraseAutocomplete', () => 'PassphraseAutocomplete')
jest.mock('../accountRestore', () => ({ matchRestoredAccounts: jest.fn() }))

const mockMatch = matchRestoredAccounts as jest.Mock

// 'abandon' x11 + 'about' is a valid 12-word BIP39 phrase.
const validPhrase = [...new Array(11).fill('abandon'), 'about']

type SelectWord = (word: string, idx?: number, canSubmit?: boolean) => void

const selectHandler = (renderer: ReactTestRenderer): SelectWord =>
  renderer.root.findByType(PassphraseAutocomplete).props.onSelectWord

const render = () => {
  let renderer!: ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(React.createElement(AccountImportScreen))
  })
  return renderer
}

const pickFirstWords = (renderer: ReactTestRenderer, count: number) => {
  validPhrase.slice(0, count).forEach((word, idx) => {
    act(() => selectHandler(renderer)(word, idx))
  })
}

const restoredAccount = {
  account: {},
  keypair: {},
  derivationPath: "m/44'/501'/0'/0'",
}

beforeAll(() => {
  ;(
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AccountImportScreen restore', () => {
  beforeEach(() => {
    mockRouteParams = { restoringAccount: true, accountAddress: 'address' }
  })

  it('restores once after the 12th pick', async () => {
    mockMatch.mockResolvedValue([restoredAccount])
    const renderer = render()

    pickFirstWords(renderer, 11)
    expect(mockMatch).not.toHaveBeenCalled()

    await act(async () => selectHandler(renderer)('about', 11))

    expect(mockMatch).toHaveBeenCalledTimes(1)
    expect(mnemonicDeriver).toHaveBeenCalledWith(validPhrase)
    expect(mockRestoreSecureAccounts).toHaveBeenCalledTimes(1)
    expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1)
  })

  it('submits again after a failed submit', async () => {
    mockMatch
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce([restoredAccount])
    const renderer = render()
    pickFirstWords(renderer, 11)

    await act(async () => selectHandler(renderer)('about', 11))
    await act(async () => selectHandler(renderer)('about', 11))

    expect(mockMatch).toHaveBeenCalledTimes(2)
    expect(mockRestoreSecureAccounts).toHaveBeenCalledTimes(1)
  })

  it('restores once when the 12th pick fires twice during a submit', async () => {
    let resolveMatch!: (value: unknown) => void
    mockMatch.mockReturnValue(
      new Promise((resolve) => {
        resolveMatch = resolve
      }),
    )
    const renderer = render()
    pickFirstWords(renderer, 11)

    const pickLast = selectHandler(renderer)
    act(() => {
      pickLast('about', 11)
      pickLast('about', 11)
    })
    await act(async () => resolveMatch([restoredAccount]))

    expect(mockMatch).toHaveBeenCalledTimes(1)
    expect(mockRestoreSecureAccounts).toHaveBeenCalledTimes(1)
  })
})

describe('AccountImportScreen import', () => {
  beforeEach(() => {
    mockRouteParams = { restoringAccount: false }
  })

  it('goes to ImportSubAccounts once after the 12th pick', () => {
    const renderer = render()
    pickFirstWords(renderer, 12)

    expect(mockNavigation.navigate).toHaveBeenCalledTimes(1)
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ImportSubAccounts')
    const [[updateOnboardingData]] = mockSetOnboardingData.mock.calls
    expect(updateOnboardingData({}).words).toEqual(validPhrase)
  })

  it('does not continue when the 12th pick cannot submit', () => {
    const renderer = render()
    pickFirstWords(renderer, 11)

    act(() => selectHandler(renderer)('about', 11, false))

    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })
})
