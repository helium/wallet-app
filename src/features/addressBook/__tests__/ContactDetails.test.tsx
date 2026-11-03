import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ContactDetails from '../ContactDetails'

const mockEditContact = jest.fn(() => Promise.resolve())
const mockGoBack = jest.fn()
const mockDeleteContact = jest.fn(() => Promise.resolve())
const mockShowOKCancelAlert = jest.fn(() => Promise.resolve(true))

// The providers hand out stable values, as the real ones do.
jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    addContact: jest.fn(),
    editContact: (...args: unknown[]) => mockEditContact(...(args as [])),
    deleteContact: (...args: unknown[]) => mockDeleteContact(...(args as [])),
  }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../../../storage/AppStorageProvider', () => {
  const appStorage = { scannedAddress: undefined, setScannedAddress: () => {} }
  return { useAppStorage: () => appStorage }
})
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { connection: undefined }
  return { useSolana: () => solana }
})
jest.mock('../AddressExtra', () => 'AddressExtra')
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: () => mockGoBack(), push: () => {} }
  const route = { params: undefined }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@react-native-community/hooks', () => ({
  useKeyboard: () => ({ keyboardShown: false }),
}))
jest.mock(
  '@hooks/useAlert',
  () => () => ({
    showOKCancelAlert: (...args: unknown[]) =>
      mockShowOKCancelAlert(...(args as [])),
  }),
  { virtual: true },
)
jest.mock(
  '@utils/accountUtils',
  () => ({
    solAddressIsValid: (address: string) => address.startsWith('sol-'),
    accountNetType: () => 'mainnet',
  }),
  { virtual: true },
)
jest.mock('@utils/getDomainOwner', () => ({ fetchDomainOwner: jest.fn() }), {
  virtual: true,
})
jest.mock('@helium/spl-utils', () => ({
  heliumAddressFromSolAddress: (address: string) => `helium-of-${address}`,
}))
jest.mock('use-debounce', () => ({ useDebounce: (value: unknown) => [value] }))
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Check: 'Check', X: 'X' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const contact = {
  address: 'helium-of-sol-old',
  solanaAddress: 'sol-old',
  alias: 'Alice',
  netType: 'mainnet',
} as never

const renderEdit = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(
      <ContactDetails action="edit" contact={contact} />,
    )
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  const button = (label: string) =>
    root
      .findAllByType('Button' as never)
      .find((b) => b.props.children === label)
  const saveButton = () => button('editContact.save')
  const deleteButton = () => button('editContact.delete')
  const inputs = () => root.findAllByType('Input' as never)
  return { saveButton, deleteButton, inputs }
}

describe('ContactDetails edit', () => {
  beforeEach(() => {
    mockEditContact.mockClear()
    mockDeleteContact.mockClear()
  })

  it('disables Save while the contact is unchanged', async () => {
    const { saveButton } = await renderEdit()
    expect(saveButton()?.props.disabled).toBe(true)
  })

  it('saves an edited address as a helium and a solana address', async () => {
    const { saveButton, inputs } = await renderEdit()
    await act(async () => {
      inputs()[0].props.onChangeText('sol-new')
    })
    expect(saveButton()?.props.disabled).toBe(false)
    await act(async () => {
      saveButton()?.props.onPress()
    })
    expect(mockEditContact).toHaveBeenCalledWith('helium-of-sol-old', {
      address: 'helium-of-sol-new',
      solanaAddress: 'sol-new',
      alias: 'Alice',
      netType: 'mainnet',
    })
  })

  it('deletes the stored contact after the address field changes', async () => {
    const { deleteButton, inputs } = await renderEdit()
    await act(async () => {
      inputs()[0].props.onChangeText('sol-new')
    })
    await act(async () => {
      await deleteButton()?.props.onPress()
    })
    expect(mockDeleteContact).toHaveBeenCalledWith('sol-old')
  })
})
