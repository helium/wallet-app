import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import PairStart from '../PairStart'

// Each test sets whether the stored accounts reached the limit.
let mockReachedAccountLimit = false
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ reachedAccountLimit: mockReachedAccountLimit }),
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {} }
  return { useNavigation: () => navigation }
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('@assets/images/ledger.svg', () => 'Ledger', { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const renderPairStart = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(<PairStart />)
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  return {
    showsAccountLimit: root
      .findAllByType('Text' as never)
      .some((n) => n.props.children === 'accountImport.accountLimit'),
    pairDisabled: root.findByType('Button' as never).props.disabled,
  }
}

describe('PairStart', () => {
  it('shows the account limit and disables Pair at the limit', () => {
    mockReachedAccountLimit = true
    expect(renderPairStart()).toEqual({
      showsAccountLimit: true,
      pairDisabled: true,
    })
  })

  it('hides the account limit and enables Pair below the limit', () => {
    mockReachedAccountLimit = false
    expect(renderPairStart()).toEqual({
      showsAccountLimit: false,
      pairDisabled: false,
    })
  })
})
