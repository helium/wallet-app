import React from 'react'

const columnMargins = { marginLeft: 117, marginRight: 117 }

jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => columnMargins }),
  { virtual: true },
)
jest.mock('../Box', () => 'Box')

// Babel copies React's exports into ContentColumn's namespace on first
// require, so the spy must exist before the component module loads
const useContextSpy = jest.spyOn(React, 'useContext')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useSheetMargins } = require('../ContentColumn')

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
