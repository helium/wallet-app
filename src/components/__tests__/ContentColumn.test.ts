import React from 'react'

const columnMargins = { marginLeft: 117, marginRight: 117 }

jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => columnMargins }),
  { virtual: true },
)
jest.mock('../Box', () => 'Box')
jest.mock('react-native', () => ({ View: 'View' }))

// Babel copies React's exports into ContentColumn's namespace on first
// require, so the spy must exist before the component module loads
const useContextSpy = jest.spyOn(React, 'useContext')
const { default: ContentColumn, useSheetMargins } =
  jest.requireActual<typeof import('../ContentColumn')>('../ContentColumn')

describe('useSheetMargins', () => {
  it('gives a sheet outside the content column the column margins', () => {
    useContextSpy.mockReturnValue(false)
    expect(useSheetMargins()).toEqual(columnMargins)
  })

  it('gives a sheet inside the content column no margins', () => {
    useContextSpy.mockReturnValue(true)
    expect(useSheetMargins()).toBeUndefined()
  })
})

describe('ContentColumn', () => {
  it('puts its children in a column box with the column margins', () => {
    const provider = ContentColumn({ children: 'child' })
    expect(provider.props.value).toBe(true)
    const column = provider.props.children
    expect(column.type).toBe('Box')
    expect(column.props.style).toEqual(columnMargins)
    expect(column.props.flex).toBe(1)
    expect(column.props.children).toBe('child')
  })
})
