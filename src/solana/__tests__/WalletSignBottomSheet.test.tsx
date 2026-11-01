import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { AccountContext } from '@helium/account-fetch-cache-hooks'
import { View } from 'react-native'
import WalletSignBottomSheet from '../WalletSignBottomSheet'
import {
  WalletSignBottomSheetRef,
  WalletStandardMessageTypes,
} from '../walletSignBottomSheetTypes'

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider. A closed
// modal keeps its content mounted until the close animation ends; then it
// unmounts the content and calls onDismiss (enableDismissOnClose).
const CLOSE_ANIMATION_MS = 250
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
      {
        children,
        onDismiss,
      }: { children: React.ReactNode; onDismiss?: () => void },
      ref: unknown,
    ) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      const closing = ReactActual.useRef(false)
      const close = () => {
        if (closing.current) return
        closing.current = true
        setTimeout(() => {
          closing.current = false
          setMount(false)
          onDismiss?.()
        }, CLOSE_ANIMATION_MS)
      }
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: close,
        close,
        expand: () => {},
        snapToIndex: () => {},
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

// The SOL balance resolves through the account fetch cache, which
// SolanaProvider supplies; outside it the cache hook throws.
jest.mock('@helium/helium-react-hooks', () => {
  const { useAccountFetchCache } = jest.requireActual(
    '@helium/account-fetch-cache-hooks',
  )
  return {
    useSolOwnedAmount: () => {
      useAccountFetchCache()
      return { amount: undefined }
    },
  }
})
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
jest.mock(
  '@hooks/useRentExempt',
  () => ({ useRentExempt: () => ({ rentExempt: '', rentExemptLamports: 0 }) }),
  { virtual: true },
)
jest.mock('@utils/formatting', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock(
  '@utils/solanaUtils',
  () => ({ estimateTxnFeeLamports: () => 0, TXN_FEE_IN_LAMPORTS: 5000 }),
  { virtual: true },
)
jest.mock('@ui/ContentColumn', () => ({ useSheetMargins: () => undefined }), {
  virtual: true,
})
jest.mock('../WalletSIgnBottomSheetSimulated', () => ({
  WalletSignBottomSheetSimulated: () => null,
}))
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('uniwind', () => ({ useResolveClassNames: () => ({}) }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/App.tsx: the root BottomSheetModalProvider wraps SolanaProvider (the
// account fetch cache), and WalletSignProvider renders inside SolanaProvider.
const AppTree = ({
  sheetRef,
}: {
  sheetRef: React.Ref<WalletSignBottomSheetRef>
}) => (
  <BottomSheetModalProvider>
    <AccountContext.Provider value={{} as never}>
      <WalletSignBottomSheet ref={sheetRef} onClose={() => {}}>
        {null}
      </WalletSignBottomSheet>
    </AccountContext.Provider>
  </BottomSheetModalProvider>
)

describe('WalletSignBottomSheet', () => {
  // The mock's close animation runs on these timers
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows the sign request inside the app providers', () => {
    const sheetRef = React.createRef<WalletSignBottomSheetRef>()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree sheetRef={sheetRef} />)
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const testIDs = () =>
      root
        .findAll((node) => typeof node.props.testID === 'string')
        .map((node) => node.props.testID)
    expect(testIDs()).toEqual([])

    act(() => {
      void sheetRef.current?.show({
        type: WalletStandardMessageTypes.signTransaction,
        renderer: () => null,
      })
    })

    expect(testIDs()).toEqual(['WalletSign.Cancel', 'WalletSign.Approve'])
  })

  it.each([
    ['WalletSign.Approve', true],
    ['WalletSign.Cancel', false],
  ])('settles show() when %s is pressed', async (testID, decision) => {
    const sheetRef = React.createRef<WalletSignBottomSheetRef>()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree sheetRef={sheetRef} />)
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    let result: Promise<boolean> | undefined
    act(() => {
      result = sheetRef.current?.show({
        type: WalletStandardMessageTypes.signTransaction,
        renderer: () => null,
      })
    })
    act(() => {
      root.findByProps({ testID }).props.onPress()
    })

    await expect(result).resolves.toBe(decision)
  })

  describe('when a new request supersedes the open one', () => {
    const requestFrom = (name: string) => ({
      type: WalletStandardMessageTypes.signTransaction,
      renderer: () => <View testID={`Request.${name}`} />,
    })

    const renderSheet = () => {
      const sheetRef = React.createRef<WalletSignBottomSheetRef>()
      let renderer: TestRenderer.ReactTestRenderer | undefined
      act(() => {
        renderer = TestRenderer.create(<AppTree sheetRef={sheetRef} />)
      })
      if (!renderer) throw new Error('render failed')
      const { root } = renderer
      return {
        show: (name: string) => {
          let result: Promise<boolean> | undefined
          act(() => {
            result = sheetRef.current?.show(requestFrom(name))
          })
          if (!result) throw new Error('show failed')
          return result
        },
        testIDs: () =>
          root
            .findAll((node) => typeof node.props.testID === 'string')
            .map((node) => node.props.testID),
        press: (testID: string) =>
          act(() => {
            root.findByProps({ testID }).props.onPress()
          }),
        finishCloseAnimation: () =>
          act(() => {
            jest.advanceTimersByTime(CLOSE_ANIMATION_MS)
          }),
      }
    }

    // An already settled request wins the race; a pending one loses it
    const settledValue = (request: Promise<boolean>) =>
      Promise.race([request, Promise.resolve('pending' as const)])

    it('closes the old sheet and approves only from a fresh one', async () => {
      const sheet = renderSheet()
      const first = sheet.show('First')
      const second = sheet.show('Second')

      await expect(first).resolves.toBe(false)
      // The old sheet closes with its own content; it never shows the new
      // request, and its buttons settle nothing
      expect(sheet.testIDs()).toEqual([
        'Request.First',
        'WalletSign.Cancel',
        'WalletSign.Approve',
      ])
      sheet.press('WalletSign.Approve')
      sheet.press('WalletSign.Cancel')
      await expect(settledValue(second)).resolves.toBe('pending')

      sheet.finishCloseAnimation()
      expect(sheet.testIDs()).toEqual([
        'Request.Second',
        'WalletSign.Cancel',
        'WalletSign.Approve',
      ])
      sheet.press('WalletSign.Approve')
      await expect(second).resolves.toBe(true)
    })

    it('presents only the latest of several superseding requests', async () => {
      const sheet = renderSheet()
      const first = sheet.show('First')
      const second = sheet.show('Second')
      const third = sheet.show('Third')

      await expect(first).resolves.toBe(false)
      await expect(second).resolves.toBe(false)
      sheet.finishCloseAnimation()
      expect(sheet.testIDs()).toEqual([
        'Request.Third',
        'WalletSign.Cancel',
        'WalletSign.Approve',
      ])
      sheet.press('WalletSign.Approve')
      await expect(third).resolves.toBe(true)
    })
  })
})
