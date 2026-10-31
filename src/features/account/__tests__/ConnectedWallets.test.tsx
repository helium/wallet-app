import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import ConnectedWallets, { ConnectedWalletsRef } from '../ConnectedWallets'

type MockSection = { title: string; data: { address: string }[] }

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider. The
// section list renders its sections and footer flat.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const { Portal, PortalProvider } = jest.requireActual('@gorhom/portal')
  const HostName = ReactActual.createContext(undefined)
  let nextId = 0
  const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [hostName] = ReactActual.useState(
      () => `bottom-sheet-portal-${(nextId += 1)}`,
    )
    return ReactActual.createElement(
      HostName.Provider,
      { value: hostName },
      ReactActual.createElement(PortalProvider, { rootHostName: hostName }, [
        children,
      ]),
    )
  }
  const BottomSheetModal = ReactActual.forwardRef(
    (
      { children, onDismiss }: { children: React.ReactNode; onDismiss(): void },
      ref: unknown,
    ) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: () => {
          setMount(false)
          onDismiss?.()
        },
      }))
      return mount
        ? ReactActual.createElement(Portal, { hostName }, children)
        : null
    },
  )
  const BottomSheetSectionList = ({
    sections,
    renderItem,
    renderSectionHeader,
    renderSectionFooter,
    ListFooterComponent,
    keyExtractor,
  }: {
    sections: MockSection[]
    renderItem: (info: { index: number; item: unknown }) => React.ReactNode
    renderSectionHeader: (info: { section: MockSection }) => React.ReactNode
    renderSectionFooter: (info: { section: MockSection }) => React.ReactNode
    ListFooterComponent: () => React.ReactNode
    keyExtractor: (item: unknown) => string
  }) =>
    ReactActual.createElement(
      ReactActual.Fragment,
      null,
      sections.map((section) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: section.title },
          renderSectionHeader({ section }),
          section.data.map((item, index) =>
            ReactActual.createElement(
              ReactActual.Fragment,
              { key: keyExtractor(item) },
              renderItem({ index, item }),
            ),
          ),
          renderSectionFooter({ section }),
        ),
      ),
      ReactActual.createElement(ListFooterComponent),
    )
  return {
    BottomSheetModalProvider: ModalProvider,
    BottomSheetModal,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    BottomSheetSectionList,
  }
})

jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock('@hooks/useLayoutHeight', () => () => [0, () => {}], {
  virtual: true,
})
jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => ({ marginLeft: 0 }) }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@helium/address', () => ({
  NetTypes: { MAINNET: 0, TESTNET: 1 },
}))

const mockNavigation = { reset: jest.fn() }
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))
const mockAccounts = [
  { address: 'a1', alias: 'Main', mnemonicHash: 'seed', netType: 0 },
  { address: 'a2', alias: 'Imported', netType: 0 },
]
const mockAccountStorage = {
  sortedAccounts: mockAccounts,
  currentAccount: mockAccounts[0],
  setCurrentAccount: jest.fn(),
}
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => mockAccountStorage,
}))
const mockAppStorage = { enableTestnet: false }
jest.mock('../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => mockAppStorage,
}))
const mockOnboarding = { setOnboardingData: () => {} }
jest.mock('../../onboarding/OnboardingProvider', () => ({
  useOnboarding: () => mockOnboarding,
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { frame: { height: 800 } },
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Check: 'Check', Plus: 'Plus' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

describe('ConnectedWallets', () => {
  it('lists the accounts when shown and closes on a pick', () => {
    const ref = React.createRef<ConnectedWalletsRef>()
    const onClose = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    // src/App.tsx: the root BottomSheetModalProvider wraps the app, and
    // RootNavigator renders ConnectedWallets around the root stack.
    act(() => {
      renderer = TestRenderer.create(
        <BottomSheetModalProvider>
          <ConnectedWallets
            ref={ref}
            onClose={onClose}
            onAddNew={() => {}}
            onAddSub={() => {}}
          >
            {null}
          </ConnectedWallets>
        </BottomSheetModalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    expect(textOf(root)).toEqual([])

    act(() => {
      ref.current?.show()
    })

    expect(textOf(root)).toEqual(
      expect.arrayContaining([
        'Seed Phrase 1',
        'Main',
        'Private Keys',
        'Imported',
        'connectedWallets.addSub',
        'connectedWallets.add',
      ]),
    )
    expect(
      root.findAll((n) => n.props.testID === 'ConnectedWallets.AddNew'),
    ).not.toHaveLength(0)

    const imported = root
      .findAllByType('PressableScale' as never)
      .find((row) => textOf(row).includes('Imported'))
    if (!imported) throw new Error('no Imported row')
    act(() => {
      imported.props.onPress()
    })

    expect(mockAccountStorage.setCurrentAccount).toHaveBeenCalledWith(
      mockAccounts[1],
    )
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Home' }],
    })
    expect(onClose).toHaveBeenCalled()
    expect(textOf(root)).toEqual([])
  })
})
