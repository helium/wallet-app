import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BlurActionSheet } from '../BlurActionSheet'

const mockPresent = jest.fn()
const mockDismiss = jest.fn()

// The node test runner cannot load react-native, the bottom sheet, the portal
// or uniwind. They render as named elements so the test reads their props.
// The Sheet stand-in exposes present and dismiss through its ref.
jest.mock('react-native', () => ({
  useWindowDimensions: () => ({ width: 400, height: 800 }),
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModalProvider: 'BottomSheetModalProvider',
  BottomSheetScrollView: 'BottomSheetScrollView',
}))
jest.mock('../RootPortal', () => ({ RootPortal: 'RootPortal' }))
jest.mock(
  '@utils/layout',
  () => ({ useContentColumnMargins: () => ({ marginHorizontal: 0 }) }),
  { virtual: true },
)
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../Sheet', () => {
  const { forwardRef, useImperativeHandle, createElement } =
    jest.requireActual('react')
  return {
    Sheet: forwardRef((props: object, ref: unknown) => {
      useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss,
      }))
      return createElement('Sheet', props)
    }),
  }
})

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

const byType = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findAllByType(type as unknown as React.ElementType)

beforeEach(() => {
  mockPresent.mockClear()
  mockDismiss.mockClear()
})

describe('BlurActionSheet', () => {
  it('renders the title above the children', () => {
    const renderer = create(
      <BlurActionSheet title="Actions">
        <Item testID="item" />
      </BlurActionSheet>,
    )

    expect(byType(renderer, 'Text')[0].props.children).toBe('Actions')
    expect(renderer.root.findByProps({ testID: 'item' })).toBeTruthy()
  })

  it('presents when open and dismisses when closed', () => {
    const renderer = create(
      <BlurActionSheet title="Actions" open>
        <Item testID="item" />
      </BlurActionSheet>,
    )
    expect(mockPresent).toHaveBeenCalledTimes(1)

    act(() => {
      renderer.update(
        <BlurActionSheet title="Actions" open={false}>
          <Item testID="item" />
        </BlurActionSheet>,
      )
    })
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('reports a dismiss through onClose', () => {
    const onClose = jest.fn()
    const [sheet] = byType(
      create(
        <BlurActionSheet title="Actions" onClose={onClose}>
          <Item testID="item" />
        </BlurActionSheet>,
      ),
      'Sheet',
    )

    act(() => {
      sheet.props.onDismiss()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('snaps to the content height, capped at 75% of the window', () => {
    const renderer = create(
      <BlurActionSheet title="Actions">
        <Item testID="item" />
      </BlurActionSheet>,
    )
    const sheet = () => byType(renderer, 'Sheet')[0]
    const layout = (height: number) =>
      act(() => {
        byType(renderer, 'SafeAreaView')[0].props.onLayout({
          nativeEvent: { layout: { height } },
        })
      })

    expect(sheet().props.snapPoints).toEqual(['75%'])
    layout(200)
    expect(sheet().props.snapPoints).toEqual([240])
    layout(1000)
    expect(sheet().props.snapPoints).toEqual([600])
  })
})

const Item = 'Item' as unknown as React.ElementType<{ testID: string }>
