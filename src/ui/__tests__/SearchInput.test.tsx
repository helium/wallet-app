import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SearchInput } from '../SearchInput'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the field render as named elements so the test reads their
// props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ Search: 'Search' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Input', () => ({ Input: 'Input' }))

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

const field = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Input' as unknown as React.ElementType)

describe('SearchInput', () => {
  it('renders a search glyph and a field with the search settings', () => {
    const onChangeText = jest.fn()
    const renderer = create(
      <SearchInput
        placeholder="Search contacts"
        value="ali"
        onChangeText={onChangeText}
      />,
    )
    const input = field(renderer)

    expect(
      renderer.root.findAllByType('Search' as unknown as React.ElementType),
    ).toHaveLength(1)
    expect(input.props).toMatchObject({
      placeholder: 'Search contacts',
      value: 'ali',
      onChangeText,
      autoCorrect: false,
      autoComplete: 'off',
      autoFocus: false,
    })
  })

  it('calls onEnter with the value on submit, only when there is a value', () => {
    const onEnter = jest.fn()
    const empty = field(
      create(<SearchInput placeholder="p" value="" onEnter={onEnter} />),
    )
    act(() => {
      empty.props.onSubmitEditing()
    })
    expect(onEnter).not.toHaveBeenCalled()

    const filled = field(
      create(<SearchInput placeholder="p" value="bob" onEnter={onEnter} />),
    )
    act(() => {
      filled.props.onSubmitEditing()
    })
    expect(onEnter).toHaveBeenCalledWith('bob')
  })

  it('lets textInputProps override the field defaults', () => {
    const onFocus = jest.fn()
    const input = field(
      create(
        <SearchInput
          placeholder="p"
          textInputProps={{ onFocus, editable: false, autoCorrect: true }}
        />,
      ),
    )
    expect(input.props.onFocus).toBe(onFocus)
    expect(input.props.editable).toBe(false)
    expect(input.props.autoCorrect).toBe(true)
  })

  it('passes className to the container and the ref to the field', () => {
    const ref = React.createRef<never>()
    const renderer = create(
      <SearchInput placeholder="p" className="mx-7 mt-8" ref={ref} />,
    )
    const container = renderer.root.findByType(
      'View' as unknown as React.ElementType,
    )

    expect(container.props.className).toContain('mx-7 mt-8')
    expect(container.props.className).toContain('bg-secondary')
    expect(field(renderer).props.ref).toBe(ref)
  })
})
