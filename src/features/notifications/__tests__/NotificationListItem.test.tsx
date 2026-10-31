import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import NotificationListItem from '../NotificationListItem'
import { Notification } from '../../../utils/walletApiV2'

jest.mock('../../../utils/parseMarkup', () => (body: string) => body)
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const notification = {
  id: 1,
  time: '2026-10-01T12:00:00Z',
  title: 'title-1',
  body: 'body-1',
} as Notification

const render = (viewed: boolean, onPress = () => {}) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      <NotificationListItem
        notification={notification}
        viewed={viewed}
        onPress={onPress}
      />,
    )
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  return {
    press: () => root.findByType('PressableScale' as never),
    dots: () =>
      root
        .findAllByType('View' as never)
        .filter((v) => String(v.props.className).includes('rounded-full')),
  }
}

describe('NotificationListItem', () => {
  it('shows the unread dot when the notification is not viewed', () => {
    expect(render(false).dots()).toHaveLength(1)
  })

  it('shows no unread dot when the notification is viewed', () => {
    expect(render(true).dots()).toHaveLength(0)
  })

  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn()
    const { press } = render(false, onPress)

    act(() => {
      press().props.onPress()
    })

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
