import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Sheet } from '../Sheet'

const mockDismiss = jest.fn()
const mockRemove = jest.fn()
const mockModalProps: { current: Record<string, unknown> } = { current: {} }
const mockHandle: { current: unknown } = { current: undefined }
let mockBackListener: (() => boolean) | undefined

// The node test runner cannot load gorhom or react-native. The modal records
// its props, exposes the methods the back handler calls, and records the
// handle it builds on each render, as gorhom does.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const BottomSheetModal = ReactActual.forwardRef(
    (props: Record<string, unknown>, ref: unknown) => {
      mockModalProps.current = props
      ReactActual.useImperativeHandle(ref, () => {
        mockHandle.current = { dismiss: mockDismiss, present: jest.fn() }
        return mockHandle.current
      })
      return null
    },
  )
  return { BottomSheetModal, BottomSheetBackdrop: 'BottomSheetBackdrop' }
})
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })
jest.mock(
  '@hooks/useBackHandler',
  () => jest.requireActual('../../hooks/useBackHandler'),
  { virtual: true },
)
jest.mock('react-native', () => ({
  View: 'View',
  Platform: { OS: 'android' },
  BackHandler: {
    addEventListener: (_event: string, listener: () => boolean) => {
      mockBackListener = listener
      return { remove: mockRemove }
    },
  },
}))

// Tell React that this runner wraps renders and callbacks in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

type ModalCallbacks = {
  onAnimate: (
    fromIndex: number,
    toIndex: number,
    fromPosition: number,
    toPosition: number,
  ) => void
  onChange: (index: number, position: number, type: number) => void
  onDismiss: () => void
}

const modal = () => mockModalProps.current as unknown as ModalCallbacks

const pressBack = () => {
  if (!mockBackListener) throw new Error('no back listener')
  return mockBackListener()
}

const render = (element: React.ReactElement) => {
  act(() => {
    TestRenderer.create(element)
  })
}

beforeEach(() => {
  mockDismiss.mockClear()
  mockRemove.mockClear()
  mockBackListener = undefined
  mockModalProps.current = {}
  mockHandle.current = undefined
})

describe('Sheet', () => {
  it('leaves Android back to the screen while the sheet is closed', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    expect(pressBack()).toBe(false)
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('dismisses the sheet on Android back while it is open', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    act(() => {
      modal().onChange(0, 100, 0)
    })

    expect(pressBack()).toBe(true)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('dismisses the sheet on Android back during the open animation', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    act(() => {
      modal().onAnimate(-1, 0, 800, 100)
    })

    expect(pressBack()).toBe(true)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('leaves Android back to the screen when a close animation starts', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    act(() => {
      modal().onAnimate(0, -1, 100, 800)
    })

    expect(pressBack()).toBe(false)
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('still calls the caller onAnimate', () => {
    const onAnimate = jest.fn()
    render(<Sheet snapPoints={['50%']} children={null} onAnimate={onAnimate} />)

    act(() => {
      modal().onAnimate(-1, 0, 800, 100)
    })

    expect(onAnimate).toHaveBeenCalledWith(-1, 0, 800, 100)
  })

  it('leaves Android back to the screen after the sheet closes', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    act(() => {
      modal().onChange(0, 100, 0)
    })
    act(() => {
      modal().onChange(-1, 800, 0)
    })

    expect(pressBack()).toBe(false)
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('leaves Android back to the screen after the sheet dismisses', () => {
    render(<Sheet snapPoints={['50%']} children={null} />)

    act(() => {
      modal().onChange(0, 100, 0)
    })
    act(() => {
      modal().onDismiss()
    })

    expect(pressBack()).toBe(false)
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('still calls the caller onChange and onDismiss', () => {
    const onChange = jest.fn()
    const onDismiss = jest.fn()
    render(
      <Sheet
        snapPoints={['50%']}
        children={null}
        onChange={onChange}
        onDismiss={onDismiss}
      />,
    )

    act(() => {
      modal().onChange(0, 100, 0)
    })
    act(() => {
      modal().onDismiss()
    })

    expect(onChange).toHaveBeenCalledWith(0, 100, 0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('gives the caller ref the modal methods', () => {
    const ref = React.createRef<{ dismiss: () => void }>()
    render(<Sheet snapPoints={['50%']} children={null} ref={ref as never} />)

    expect(ref.current?.dismiss).toBe(mockDismiss)
  })

  it("gives the caller ref the modal's latest handle after a re-render", () => {
    const ref = React.createRef<unknown>()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <Sheet snapPoints={['50%']} children={null} ref={ref as never} />,
      )
    })
    const firstHandle = mockHandle.current

    act(() => {
      renderer?.update(
        <Sheet snapPoints={['80%']} children={null} ref={ref as never} />,
      )
    })

    expect(ref.current).toBe(mockHandle.current)
    expect(ref.current).not.toBe(firstHandle)
  })
})
