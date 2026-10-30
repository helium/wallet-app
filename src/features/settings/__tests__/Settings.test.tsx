import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import Settings from '../Settings'

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider.
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
    ({ children }: { children: React.ReactNode }, ref: unknown) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: () => setMount(false),
      }))
      return mount
        ? ReactActual.createElement(Portal, { hostName }, children)
        : null
    },
  )
  return {
    BottomSheetModalProvider: ModalProvider,
    BottomSheetModal,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    BottomSheetScrollView: 'BottomSheetScrollView',
  }
})

jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@hooks/useDisappear', () => () => {}, { virtual: true })
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock('@utils/sleep', () => () => Promise.resolve(), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})

jest.mock('@helium/spl-utils', () => ({ truthy: Boolean }))
jest.mock(
  '@hooks/useAlert',
  () => () => ({ showOKAlert: jest.fn(), showOKCancelAlert: jest.fn() }),
  { virtual: true },
)
jest.mock('@hooks/useDevice', () => ({ useAppVersion: () => '1.0.0' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useExplorer',
  () => ({
    useExplorer: () => ({ explorers: [], current: undefined }),
  }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {} }),
}))
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({}) }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    View: 'View',
    Image: 'Image',
    Switch: 'Switch',
    Alert: { alert: () => {} },
    Linking: { openURL: () => Promise.resolve() },
    Platform: { OS: 'ios' },
    useWindowDimensions: () => ({ width: 400, height: 800 }),
    // renders every row, as the screen asks with initialNumToRender
    SectionList: ({
      sections,
      renderItem,
    }: {
      sections: { title: string; data: unknown[] }[]
      renderItem: (info: { item: unknown; index: number }) => React.ReactNode
    }) =>
      ReactActual.createElement(
        'SectionList',
        null,
        sections.flatMap((section) =>
          section.data.map((item, index) =>
            ReactActual.createElement(
              ReactActual.Fragment,
              { key: `${section.title}${index}` },
              renderItem({ item, index }),
            ),
          ),
        ),
      ),
  }
})
jest.mock('react-native-device-info', () => ({ getBuildNumber: () => '1' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('react-native-svg', () => ({ SvgUri: 'SvgUri' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronRight: 'ChevronRight',
  Link: 'Link',
  X: 'X',
}))

jest.mock('../../../constants/urls', () => ({}))
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: 'mainnet-beta', updateCluster: () => {} }),
}))
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ accounts: {} }),
}))
jest.mock('../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ currency: 'USD' }),
}))
jest.mock('../../../storage/ModalsProvider', () => ({
  useModal: () => ({ showModal: () => {} }),
}))
jest.mock('../../../storage/LanguageProvider', () => ({
  useLanguageStorage: () => ({ language: 'en' }),
}))
jest.mock('../../../storage/secureStorage', () => ({}))
jest.mock('../../../utils/i18n', () => ({ SUPPORTED_LANGUAGUES: [] }))
jest.mock('../../../utils/queryClient', () => ({ queryClient: {} }))
jest.mock('../../../utils/supportedCurrencies', () => ({}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/App.tsx: the root BottomSheetModalProvider sits outside
// NavigationContainer, and the settings stack renders inside it.
const AppTree = () => (
  <BottomSheetModalProvider>
    {React.createElement('NavigationContainer', null, <Settings />)}
  </BottomSheetModalProvider>
)

describe('Settings', () => {
  it('opens the cluster sheet inside the navigation tree', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer) throw new Error('render failed')
    const navigation = renderer.root.findByType('NavigationContainer' as never)

    await act(async () => {
      navigation.findByProps({ testID: 'Settings.Cluster' }).props.onPress()
    })

    expect(
      navigation.findAllByProps({ testID: 'ActionSheet.devnet' }),
    ).toHaveLength(1)
  })
})
