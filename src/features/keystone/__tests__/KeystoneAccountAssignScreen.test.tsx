import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Keypair } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import KeystoneAccountAssignScreen from '../KeystoneAccountAssignScreen'

jest.mock('react-native', () => ({
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@ui/FabButton', () => ({ FabButton: 'FabButton' }), {
  virtual: true,
})
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
const mockReset = jest.fn()
const mockReplace = jest.fn()
jest.mock('@react-navigation/native', () => {
  const navigation = {
    reset: (...args: unknown[]) => mockReset(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  }
  return { useNavigation: () => navigation }
})
const mockUpsertAccounts = jest.fn()
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    accounts: {},
    hasAccounts: true,
    upsertAccounts: (...args: unknown[]) => mockUpsertAccounts(...args),
  }
  return { useAccountStorage: () => accountStorage }
})
// One account the Keystone shared, as SelectKeystoneAccountsScreen stores it
jest.mock('../KeystoneOnboardingProvider', () => {
  const { Keypair: KeypairActual } = jest.requireActual('@solana/web3.js')
  const publicKey = KeypairActual.fromSeed(
    new Uint8Array(32).fill(1),
  ).publicKey.toBytes()
  const onboarding = {
    keystoneOnboardingData: {
      accounts: [
        {
          path: "m/44'/501'/0'",
          publicKey: Buffer.from(publicKey).toString('hex'),
          masterFingerprint: 'fingerprint',
          device: 'Keystone 3 Pro',
        },
      ],
    },
  }
  return { useKeystoneOnboarding: () => onboarding }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const renderers: TestRenderer.ReactTestRenderer[] = []

const render = async () => {
  let renderer!: TestRenderer.ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={new QueryClient()}>
        <KeystoneAccountAssignScreen />
      </QueryClientProvider>,
    )
  })
  renderers.push(renderer)
  return renderer
}

const nameAndContinue = async (renderer: TestRenderer.ReactTestRenderer) => {
  await act(async () => {
    renderer.root.findByType('Input' as never).props.onChangeText('Keystone')
  })
  await act(async () => {
    renderer.root.findByType('FabButton' as never).props.onPress()
  })
  // react-query notifies observers on a 0 ms timer; flush it inside act.
  await act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      }),
  )
}

const shows = (renderer: TestRenderer.ReactTestRenderer, text: string) =>
  renderer.root
    .findAllByType('Text' as never)
    .some((n) => n.props.children === text)

beforeEach(() => {
  mockReset.mockReset()
  mockReplace.mockReset()
  mockUpsertAccounts.mockReset()
})

afterEach(async () => {
  await act(async () => {
    renderers.forEach((renderer) => renderer.unmount())
  })
  renderers.length = 0
})

describe('KeystoneAccountAssignScreen', () => {
  it('shows the save error and stays on the screen when the accounts fail to save', async () => {
    mockUpsertAccounts.mockRejectedValue(new Error('write failed'))
    const renderer = await render()

    await nameAndContinue(renderer)

    expect(mockUpsertAccounts).toHaveBeenCalledTimes(1)
    expect(shows(renderer, 'write failed')).toBe(true)
    expect(mockReset).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('saves the Keystone account and resets to the tabs', async () => {
    mockUpsertAccounts.mockResolvedValue(undefined)
    const renderer = await render()

    await nameAndContinue(renderer)

    const solanaAddress = Keypair.fromSeed(
      new Uint8Array(32).fill(1),
    ).publicKey.toBase58()
    expect(mockUpsertAccounts).toHaveBeenCalledWith([
      expect.objectContaining({ alias: 'Keystone 1', solanaAddress }),
    ])
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'TabBarNavigator' }],
    })
  })
})
