import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import NotificationDetails from '../NotificationDetails'

const mockGoBack = jest.fn()
const mockMarkNotificationRead = jest.fn()
const mockSetSelectedNotification = jest.fn()
let mockBeforeRemove: (() => void) | undefined

let mockNotification: Record<string, unknown> = {}
jest.mock('@react-navigation/native', () => {
  const navigation = {
    goBack: () => mockGoBack(),
    addListener: (_event: string, listener: () => void) => {
      mockBeforeRemove = listener
      return () => {}
    },
  }
  return {
    useNavigation: () => navigation,
    useRoute: () => ({ params: { notification: mockNotification } }),
  }
})

let mockSelectedList = 'account-a'
jest.mock('../../../storage/NotificationStorageProvider', () => ({
  useNotificationStorage: () => ({
    selectedList: mockSelectedList,
    apiResource: 'api-resource',
    markNotificationRead: mockMarkNotificationRead,
    setSelectedNotification: mockSetSelectedNotification,
  }),
}))
jest.mock('../../../utils/layout', () => ({ useContentWidth: () => 375 }))
jest.mock('../../../utils/logger', () => ({ breadcrumb: () => {} }))
jest.mock(
  '@hooks/usePrevious',
  () => jest.requireActual('../../../hooks/usePrevious'),
  { virtual: true },
)
jest.mock(
  '@hooks/useMount',
  () => jest.requireActual('../../../hooks/useMount'),
  {
    virtual: true,
  },
)
jest.mock('@assets/images/hipBanner.png', () => 'hipBanner.png', {
  virtual: true,
})
jest.mock('react-native', () => ({ View: 'View', Image: 'Image' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ChevronLeft: 'ChevronLeft' }))
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
    renderer = TestRenderer.create(<NotificationDetails />)
  })
  if (!renderer) throw new Error('render failed')
  const r = renderer
  return {
    renderer: r,
    texts: () =>
      r.root.findAllByType('Text' as never).map((n) => n.props.children),
    images: () => r.root.findAllByType('Image' as never),
    back: () => r.root.findAllByType('PressableScale' as never)[0],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSelectedList = 'account-a'
  mockBeforeRemove = undefined
  mockNotification = {
    id: 7,
    time: '2026-10-01T18:00:00Z',
    title: 'Network upgrade',
    body: 'Upgrade on Friday',
    icon: 'hip',
  }
})

describe('NotificationDetails', () => {
  it('shows the notification and marks it read once', async () => {
    const view = await render()

    expect(view.texts()).toContain('Network upgrade')
    expect(view.texts()).toContain('Upgrade on Friday')
    expect(view.images()[0].props.source).toBe('hipBanner.png')
    expect(mockMarkNotificationRead).toHaveBeenCalledTimes(1)
    expect(mockMarkNotificationRead).toHaveBeenCalledWith({
      resource: 'api-resource',
      id: 7,
    })
  })

  it('shows no banner for the icon none', async () => {
    mockNotification.icon = 'none'

    const view = await render()

    expect(view.images()).toHaveLength(0)
  })

  it('goes back on the back press', async () => {
    const view = await render()

    act(() => {
      view.back().props.onPress()
    })
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('clears the selected notification when the screen is removed', async () => {
    await render()

    act(() => {
      mockBeforeRemove?.()
    })
    expect(mockSetSelectedNotification).toHaveBeenCalledWith(undefined)
  })

  it('goes back when another list is selected', async () => {
    const view = await render()
    expect(mockGoBack).not.toHaveBeenCalled()

    mockSelectedList = 'account-b'
    await act(async () => {
      view.renderer.update(<NotificationDetails />)
    })
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })
})
