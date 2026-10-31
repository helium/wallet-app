import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  ContentColumn,
  contentColumnLayout,
  useSheetMargins,
} from '../ContentColumn'

const columnMargins = { marginLeft: 117, marginRight: 117 }

// The node test runner cannot load react-native. The host components render
// as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => columnMargins }),
  { virtual: true },
)

// Tell React that this runner wraps renders in act().
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

const SheetMarginsProbe = () => {
  const margins = useSheetMargins()
  return <View testID="probe" style={margins} />
}
const View = 'View' as unknown as React.ElementType
const probe = (root: TestRenderer.ReactTestInstance) =>
  root.find((node) => node.type === View && node.props.testID === 'probe')

describe('ContentColumn', () => {
  it('holds its children in a flex-1 view at the column margins', () => {
    const { root } = create(
      <ContentColumn testID="column" className="bg-background">
        child
      </ContentColumn>,
    )
    const column = root.findByType(View)

    expect(column.props.testID).toBe('column')
    expect(column.props.className).toContain('flex-1')
    expect(column.props.className).toContain('bg-background')
    expect(column.props.style).toEqual([columnMargins, undefined])
    expect(column.props.children).toBe('child')
  })

  it('gives a sheet outside the column the column margins', () => {
    const { root } = create(<SheetMarginsProbe />)
    expect(probe(root).props.style).toEqual(columnMargins)
  })

  it('gives a sheet inside the column no margins', () => {
    const { root } = create(
      <ContentColumn>
        <SheetMarginsProbe />
      </ContentColumn>,
    )
    expect(probe(root).props.style).toBeUndefined()
  })
})

describe('contentColumnLayout', () => {
  it('holds a navigator screen in the content column', () => {
    const { root } = create(contentColumnLayout({ children: <>screen</> }))
    const column = root.findByType(View)

    expect(column.props.style).toEqual([columnMargins, undefined])
    expect(column.props.children).toEqual(<>screen</>)
  })
})
