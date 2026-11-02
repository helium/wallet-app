import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { BurnRouteParam } from '../../home/homeTypes'
import BurnScreen from '../BurnScreen'

// The route params, as the navigator holds them for the open screen.
let mockParams: BurnRouteParam
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: mockParams }),
  useNavigation: () => ({
    goBack: () => {},
    navigate: () => {},
    popToTop: () => {},
  }),
}))
jest.mock('@ui/AccountButton', () => ({ AccountButton: 'AccountButton' }), {
  virtual: true,
})
jest.mock(
  '@ui/AccountSelector',
  () => ({ AccountSelector: 'AccountSelector' }),
  {
    virtual: true,
  },
)
jest.mock(
  '@ui/AddressBookSelector',
  () => ({ AddressBookSelector: 'AddressBookSelector' }),
  { virtual: true },
)
jest.mock('@ui/HNTKeyboard', () => ({ HNTKeyboard: 'HNTKeyboard' }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/SubmitButton', () => ({ SubmitButton: 'SubmitButton' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenButton', () => ({ TokenButton: 'TokenButton' }), {
  virtual: true,
})
jest.mock('@ui/TokenSelector', () => ({ TokenSelector: 'TokenSelector' }), {
  virtual: true,
})
jest.mock('@helium/address', () => ({
  __esModule: true,
  default: { isValid: () => true },
  NetTypes: { MAINNET: 0 },
}))
jest.mock('@helium/helium-react-hooks', () => ({
  useOwnedAmount: () => ({ amount: undefined }),
  useSolOwnedAmount: () => ({ amount: undefined }),
}))
jest.mock('@helium/spl-utils', () => {
  const mint = (name: string) => ({
    name,
    equals(other: { name: string }) {
      return other.name === name
    },
  })
  return {
    DC_MINT: mint('dc'),
    IOT_MINT: mint('iot'),
    MOBILE_MINT: mint('mobile'),
    humanReadable: () => '',
  }
})
jest.mock('@solana/web3.js', () => ({ PublicKey: jest.fn() }))
jest.mock('@hooks/useAlert', () => () => ({ showOKAlert: jest.fn() }), {
  virtual: true,
})
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'IOT' }) }),
  { virtual: true },
)
jest.mock('../../../hooks/useSubmitTxn', () => () => ({
  submitDelegateDataCredits: jest.fn(),
  delegateDataCreditsMutation: { data: undefined, reset: jest.fn() },
}))
jest.mock('../../../hooks/useTransactionBatchStatus', () => ({
  useTransactionBatchStatus: () => ({
    status: undefined,
    transactions: [],
    isLoading: false,
  }),
}))
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    accounts: {},
    currentAccount: undefined,
    sortedAccountsForNetType: () => [],
    setCurrentAccount: () => {},
    defaultAccountAddress: undefined,
  }),
}))
jest.mock('../../../utils/Balance', () => ({
  useBalance: () => ({ networkTokensToDc: () => undefined }),
}))
jest.mock('../../../utils/accountUtils', () => ({
  accountNetType: () => 0,
  ellipsizeAddress: (a: string) => a,
  formatAccountAlias: () => '',
  solAddressIsValid: () => true,
}))
jest.mock('../../../utils/solanaUtils', () => ({ TXN_FEE_IN_SOL: 5000 }))
jest.mock('../../payment/logic/batchFailure', () => ({
  batchFailure: () => undefined,
}))
jest.mock('../../payment/logic/retrySet', () => ({ retrySet: () => false }))
jest.mock('../../payment/PaymentItem', () => 'PaymentItem')
jest.mock('../../payment/PaymentSubmit', () => 'PaymentSubmit')
jest.mock('../../payment/PaymentSummary', () => 'PaymentSummary')
jest.mock('lucide-react-native', () => ({ QrCode: 'QrCode', X: 'X' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ Platform: { OS: 'ios' }, View: 'View' }))
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('BurnScreen', () => {
  it('shows a new delegate address and memo from the route until the user edits them', () => {
    mockParams = { address: 'addr1', memo: 'memo1', isDelegate: true }
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<BurnScreen />)
    })
    const item = () => renderer.root.findByType('PaymentItem' as never).props
    expect(item().address).toBe('addr1')
    expect(item().memo).toBe('memo1')

    // A deep link opens the same screen with new params.
    mockParams = { address: 'addr2', memo: 'memo2', isDelegate: true }
    act(() => {
      renderer.update(<BurnScreen />)
    })
    expect(item().address).toBe('addr2')
    expect(item().memo).toBe('memo2')

    // The user clears both fields, and a later param does not refill them.
    act(() => {
      item().onEditAddress({ address: '' })
      item().onEditMemo({ memo: '' })
    })
    mockParams = { address: 'addr3', memo: 'memo3', isDelegate: true }
    act(() => {
      renderer.update(<BurnScreen />)
    })
    expect(item().address).toBe('')
    expect(item().memo).toBe('')
  })
})
