import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountSliderIcon from '../AccountSliderIcon'

let mockNotificationsByResource: Record<string, { viewedAt?: string }[]> = {}
jest.mock('../../../storage/NotificationStorageProvider', () => ({
  useNotificationStorage: () => ({
    notificationsByResource: mockNotificationsByResource,
  }),
}))
jest.mock('@helium/spl-utils', () => ({
  heliumAddressToSolAddress: (a: string) => `sol-${a}`,
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (selected = false) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      <AccountSliderIcon
        icon={null}
        resource="account-a"
        index={0}
        onPress={() => {}}
        selected={selected}
      />,
    )
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  return {
    press: () => root.findByType('PressableScale' as never),
    // The unread dot is the last View, a sibling of the press target.
    dot: () => root.findAllByType('View' as never).slice(-1)[0],
  }
}

beforeEach(() => {
  mockNotificationsByResource = {}
})

describe('AccountSliderIcon', () => {
  it('shows the unread dot when a notification is not viewed', () => {
    mockNotificationsByResource = {
      'sol-account-a': [{ viewedAt: '2026-10-01' }, {}],
    }

    expect(render().dot().props.className).not.toContain('opacity-0')
  })

  it('hides the unread dot when every notification is viewed', () => {
    mockNotificationsByResource = {
      'sol-account-a': [{ viewedAt: '2026-10-01' }],
    }

    expect(render().dot().props.className).toContain('opacity-0')
  })

  it('marks the press target selected to match the selected prop', () => {
    expect(render(true).press().props.accessibilityState).toEqual({
      selected: true,
    })
    expect(render(false).press().props.accessibilityState).toEqual({
      selected: false,
    })
  })
})
