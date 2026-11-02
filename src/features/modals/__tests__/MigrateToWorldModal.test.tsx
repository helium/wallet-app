import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import MigrateToWorldModal from '../MigrateToWorldModal'

// The node test runner cannot load gorhom (Reanimated, gesture handler). The
// sheet is a host element here, so the test reads the props the card gives it.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const BottomSheet = ReactActual.forwardRef(
    (props: Record<string, unknown>, _ref: unknown) =>
      ReactActual.createElement('BottomSheet', props),
  )
  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    BottomSheetView: 'BottomSheetView',
  }
})

jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {} }),
}))
jest.mock(
  '@storage/AppStorageProvider',
  () => ({ useAppStorage: () => ({ dismissMigrateToWorld: () => {} }) }),
  { virtual: true },
)
jest.mock(
  '@storage/ModalsProvider',
  () => ({ useModal: () => ({ type: 'MigrateToWorld', hideModal: () => {} }) }),
  { virtual: true },
)
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/ContentColumn', () => ({ useSheetMargins: () => ({}) }), {
  virtual: true,
})
jest.mock(
  '@ui/Sheet',
  () => ({ SheetBackground: 'SheetBackground', SheetHandle: 'SheetHandle' }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Platform: { OS: 'ios' },
  BackHandler: { addEventListener: () => ({ remove: () => {} }) },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('MigrateToWorldModal', () => {
  // On iOS an accessible view is one element with no children in the
  // accessibility tree, so Maestro sees only "Bottom Sheet". gorhom makes the
  // sheet accessible by default.
  it('exposes Maybe later to the accessibility tree by its testID', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<MigrateToWorldModal />)
    })

    const sheet = renderer.root.findByType(
      'BottomSheet' as unknown as React.ElementType,
    )
    expect(sheet.props.accessible).toBe(false)
    expect(
      sheet.findAll((node) => node.props.testID === 'MigrateToWorld.NotNow'),
    ).not.toHaveLength(0)
  })
})
