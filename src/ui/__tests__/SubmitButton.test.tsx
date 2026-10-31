import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SubmitButton } from '../SubmitButton'

// The node test runner cannot load react-native, lucide, uniwind or the swipe
// button. Each renders as a named element so the test reads its props. A
// class resolves to a style that names the class, so the test can tell which
// token fed each colour.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ Hand: 'Hand' }))
jest.mock('rn-swipe-button', () => 'SwipeButton')
jest.mock('uniwind', () => ({
  useResolveClassNames: (className: string) => ({
    color: className,
    backgroundColor: className,
  }),
}))

// Tell React that this runner wraps renders and swipes in act().
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

const swipe = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('SwipeButton' as unknown as React.ElementType)

describe('SubmitButton', () => {
  it('calls onSubmit when the swipe completes', () => {
    const onSubmit = jest.fn()
    const button = swipe(
      create(<SubmitButton title="Send" onSubmit={onSubmit} />),
    )

    expect(button.props.title).toBe('Send')
    act(() => {
      button.props.onSwipeSuccess()
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders the thumb with the SubmitButton.Thumb testID in the swipe colour', () => {
    const button = swipe(create(<SubmitButton title="Send" />))
    const thumb = create(button.props.thumbIconComponent())

    const view = thumb.root.findByType('View' as unknown as React.ElementType)
    expect(view.props.testID).toBe('SubmitButton.Thumb')
    const hand = thumb.root.findByType('Hand' as unknown as React.ElementType)
    expect(hand.props.color).toBe('text-blue-dark-500')
  })

  it('uses the destructive colour on a background rail when asked', () => {
    const button = swipe(
      create(
        <SubmitButton
          title="Approve"
          color="destructive"
          backgroundColor="background"
        />,
      ),
    )

    expect(button.props.thumbIconBorderColor).toBe('text-destructive')
    expect(button.props.thumbIconBackgroundColor).toBe('bg-background')
  })

  it('greys the title and passes disabled to the swipe', () => {
    const button = swipe(create(<SubmitButton title="Send" disabled />))

    expect(button.props.disabled).toBe(true)
    expect(button.props.titleStyles.color).toBe('text-muted-foreground')
  })

  it('merges the caller className onto the rounded wrapper', () => {
    const renderer = create(<SubmitButton title="Send" className="mt-6" />)
    const [wrapper] = renderer.root.findAllByType(
      'View' as unknown as React.ElementType,
    )

    expect(wrapper.props.className).toContain('rounded-full')
    expect(wrapper.props.className).toContain('mt-6')
  })
})
