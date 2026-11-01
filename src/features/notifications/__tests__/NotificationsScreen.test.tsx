import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import NotificationsScreen from '../NotificationsScreen'

const mockNavigate = jest.fn()
const mockOpenURL = jest.fn((_url: string) => Promise.resolve())
const mockUpdateAllNotifications = jest.fn()
const mockSetSelectedNotification = jest.fn()

const notification = (
  id: number,
  time: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  time,
  title: `title-${id}`,
  body: `body-${id}`,
  viewedAt: '',
  icon: 'none',
  ...extra,
})

// Each test sets the storage this screen reads. The object stays the same
// across renders, as the provider's memoised value does.
let mockStorage: Record<string, unknown> = {}
jest.mock('../../../storage/NotificationStorageProvider', () => ({
  useNotificationStorage: () => mockStorage,
}))
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = {
    sortedAccounts: [{ address: 'account-a' }],
    currentAccount: { address: 'account-a' },
  }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../../../utils/accountUtils', () => ({
  isValidAccountHash: () => Promise.resolve(false),
}))
jest.mock('../../../utils/layout', () => ({ useContentWidth: () => 375 }))
jest.mock('../../../utils/logger', () => ({ breadcrumb: () => {} }))
jest.mock('@helium/spl-utils', () => ({
  heliumAddressToSolAddress: (a: string) => a,
}))

// @react-navigation ships ESM only, which this jest config does not
// transform.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useIsFocused: () => true,
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// A SectionList that renders every section header, item, the empty view
// and the footer in order.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  const render = (C: unknown) =>
    typeof C === 'function' ? ReactActual.createElement(C) : C
  return {
    View: 'View',
    Image: 'Image',
    Linking: { openURL: (url: string) => mockOpenURL(url) },
    StyleSheet: { create: (s: unknown) => s },
    SectionList: ({
      sections,
      renderItem,
      renderSectionHeader,
      ListEmptyComponent,
      ListFooterComponent,
    }: {
      sections: { title: string; data: unknown[] }[]
      renderItem: (i: unknown) => React.ReactNode
      renderSectionHeader: (s: unknown) => React.ReactNode
      ListEmptyComponent: unknown
      ListFooterComponent: unknown
    }) =>
      ReactActual.createElement(
        'SectionList',
        null,
        sections.length === 0 ? render(ListEmptyComponent) : null,
        sections.map((section) =>
          ReactActual.createElement(
            ReactActual.Fragment,
            { key: section.title },
            renderSectionHeader({ section }),
            section.data.map((item, index) =>
              ReactActual.createElement(
                ReactActual.Fragment,
                { key: index },
                renderItem({ item, index, section }),
              ),
            ),
          ),
        ),
        render(ListFooterComponent),
      ),
  }
})
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
  Extrapolation: { CLAMP: 'clamp' },
  interpolate: () => 1,
}))
jest.mock('react-native-reanimated-carousel', () => {
  const ReactActual = jest.requireActual('react')
  return {
    Carousel: ({
      data,
      renderItem,
    }: {
      data: string[]
      renderItem: (i: unknown) => React.ReactNode
    }) =>
      ReactActual.createElement(
        'Carousel',
        null,
        data.map((item, index) => renderItem({ item, index })),
      ),
  }
})
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@assets/images/walletUpdateIcon.svg', () => 'WalletUpdate', {
  virtual: true,
})
jest.mock('@assets/images/heliumUpdateIcon.svg', () => 'HeliumUpdate', {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<NotificationsScreen />)
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  const texts = () =>
    root
      .findAllByType('Text' as never)
      .map((n) => n.props.children)
      .flat()
  return {
    texts,
    rowFor: (title: string) =>
      root
        .findAllByType('PressableScale' as never)
        .find((row) =>
          row
            .findAllByType('Text' as never)
            .some((t) => t.props.children === title),
        ),
    buttons: () => root.findAllByType('Button' as never),
    accountIcons: () => root.findAllByType('AccountIcon' as never),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockStorage = {
    notifications: [],
    notificationsByResource: {},
    selectedList: 'account-a',
    selectedNotification: undefined,
    setSelectedNotification: mockSetSelectedNotification,
    updateAllNotifications: mockUpdateAllNotifications,
    updateSelectedList: () => {},
    openedNotification: undefined,
    setOpenedNotification: () => {},
  }
})

describe('NotificationsScreen', () => {
  it('refreshes notifications when it gains focus', async () => {
    await render()

    expect(mockUpdateAllNotifications).toHaveBeenCalledTimes(1)
  })

  it('shows the title, the update lists and the accounts in the slider', async () => {
    const view = await render()

    expect(view.texts()).toContain('notifications.title')
    expect(view.accountIcons().map((i) => i.props.address)).toEqual([
      'account-a',
    ])
  })

  it('shows the empty title when there are no notifications', async () => {
    const view = await render()

    expect(view.texts()).toContain('notifications.emptyTitle')
  })

  it('groups notifications by local day and opens one on press', async () => {
    const first = notification(1, '2026-10-01T18:00:00Z')
    const second = notification(2, '2026-10-01T20:00:00Z')
    const third = notification(3, '2026-10-03T18:00:00Z')
    mockStorage.notifications = [first, second, third]

    const view = await render()

    const texts = view.texts()
    expect(texts).toContain('Thu Oct 01 2026')
    expect(texts).toContain('Sat Oct 03 2026')
    expect(texts).toContain('title-1')
    expect(texts).toContain('body-3')
    expect(texts).not.toContain('notifications.emptyTitle')

    act(() => {
      view.rowFor('title-2')?.props.onPress()
    })
    expect(mockNavigate).toHaveBeenCalledWith('NotificationDetails', {
      notification: second,
    })
    expect(mockSetSelectedNotification).toHaveBeenCalledWith(second)
  })

  it('opens the action link of the selected notification', async () => {
    mockStorage.selectedNotification = notification(4, '2026-10-01T18:00:00Z', {
      actionTitle: 'Read more',
      actionUrl: 'https://example.com/read',
    })

    const view = await render()

    const [action] = view.buttons()
    expect(action.props.children).toBe('Read more')
    act(() => {
      action.props.onPress()
    })
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/read')
  })

  it.each([
    // eslint-disable-next-line no-script-url -- the scheme under test
    'javascript:alert(1)',
    'tel:+15555550100',
    'sms:+15555550100',
    'file:///etc/passwd',
    'intent://scan/#Intent;scheme=zxing;end',
    'heliumwallet://import_key/abc',
    'zcash://pay',
    'not a url',
  ])('opens nothing for an action link to %s', async (actionUrl) => {
    mockStorage.selectedNotification = notification(8, '2026-10-01T18:00:00Z', {
      actionTitle: 'Read more',
      actionUrl,
    })

    const view = await render()

    act(() => {
      view.buttons()[0].props.onPress()
    })
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('shows no action button without an action link', async () => {
    mockStorage.selectedNotification = notification(5, '2026-10-01T18:00:00Z', {
      actionTitle: 'Read more',
    })

    const view = await render()

    expect(view.buttons()).toHaveLength(0)
  })

  it('shows no action button without an action title', async () => {
    mockStorage.selectedNotification = notification(6, '2026-10-01T18:00:00Z', {
      actionUrl: 'https://example.com/read',
    })

    const view = await render()

    expect(view.buttons()).toHaveLength(0)
  })

  it('logs a failed action link instead of leaving the rejection unhandled', async () => {
    const failure = new Error('cannot open')
    mockOpenURL.mockImplementationOnce(() => Promise.reject(failure))
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    mockStorage.selectedNotification = notification(7, '2026-10-01T18:00:00Z', {
      actionTitle: 'Read more',
      actionUrl: 'https://example.com/read',
    })

    try {
      const view = await render()
      await act(async () => {
        view.buttons()[0].props.onPress()
      })
      await new Promise((resolve) => setImmediate(resolve))

      expect(consoleError).toHaveBeenCalledWith(failure)
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', unhandled)
      consoleError.mockRestore()
    }
  })
})
