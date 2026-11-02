import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountCreateStart from '../AccountCreateStart'

jest.mock('../../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ reachedAccountLimit: false }),
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: () => {} }
  return { useNavigation: () => navigation }
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock(
  '@ui/FocusAwareStatusBar',
  () => ({ FocusAwareStatusBar: 'FocusAwareStatusBar' }),
  { virtual: true },
)
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('lucide-react-native', () => ({ CirclePlus: 'CirclePlus', X: 'X' }))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const safeAreaEdges = (inline: boolean) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      <AccountCreateStart onCreate={() => {}} inline={inline} />,
    )
  })
  if (!renderer) throw new Error('render failed')
  return renderer.root.findByType('TabSafeAreaView' as never).props.edges
}

describe('AccountCreateStart', () => {
  // AddNewAccountScreen's header already pads the top inset.
  it('pads only the bottom inset when inline', () => {
    expect(safeAreaEdges(true)).toEqual(['bottom'])
  })

  it('pads every inset as a full screen', () => {
    expect(safeAreaEdges(false)).toBeUndefined()
  })
})
