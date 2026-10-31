import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ListItem } from '../ListItem'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the row press target render as named elements so the test
// reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ CircleCheck: 'CircleCheck' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../TouchableContainer', () => ({
  TouchableContainer: 'TouchableContainer',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

const View = 'View' as unknown as React.ElementType

const byType = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findAllByType(type as unknown as React.ElementType)

describe('ListItem', () => {
  it('renders the title and subtitle in a divided row', () => {
    const renderer = create(<ListItem title="All" subtitle="Every txn" />)
    const [row] = byType(renderer, 'TouchableContainer')
    const texts = byType(renderer, 'Text').map((t) => t.props.children)

    expect(texts).toEqual(['All', 'Every txn'])
    expect(row.props.className).toContain('border-b')
    expect(byType(renderer, 'CircleCheck')).toHaveLength(0)
  })

  it('drops the divider when hasDivider is false', () => {
    const [row] = byType(
      create(<ListItem title="All" hasDivider={false} />),
      'TouchableContainer',
    )
    expect(row.props.className).not.toContain('border-b')
  })

  it('shows a check when selected, dimmed when disabled', () => {
    const [check] = byType(
      create(<ListItem title="All" selected />),
      'CircleCheck',
    )
    expect(check.props.size).toBe(20)
    expect(check.props.className ?? '').not.toContain('opacity-60')

    const [dimmed] = byType(
      create(<ListItem title="All" selected disabled />),
      'CircleCheck',
    )
    expect(dimmed.props.className).toContain('opacity-60')
  })

  it('passes the press, state, testID and className to the row', () => {
    const onPress = jest.fn()
    const renderer = create(
      <ListItem
        title="Split"
        onPress={onPress}
        disabled
        hasPressedState={false}
        testID="Positions.Manage.split"
        className="pl-6"
      />,
    )
    const [row] = byType(renderer, 'TouchableContainer')

    expect(row.props.testID).toBe('Positions.Manage.split')
    expect(row.props.disabled).toBe(true)
    expect(row.props.hasPressedState).toBe(false)
    expect(row.props.className).toContain('pl-6')
    act(() => {
      row.props.onPress()
    })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the leading and trailing icons', () => {
    const renderer = create(
      <ListItem
        title="Claim"
        Icon={<View testID="lead" />}
        SecondaryIcon={<View testID="trail" />}
      />,
    )
    expect(renderer.root.findAllByProps({ testID: 'lead' })).not.toHaveLength(0)
    expect(renderer.root.findAllByProps({ testID: 'trail' })).not.toHaveLength(
      0,
    )
  })
})
