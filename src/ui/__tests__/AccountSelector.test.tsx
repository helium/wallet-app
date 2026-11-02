import type { CSAccount } from '@storage/cloudStorage'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  AccountSelector,
  type AccountSelectorRef,
  isGesture,
} from '../AccountSelector'

const mockSetCurrentAccount = jest.fn()
const mockSortedAccountsForNetType = jest.fn()
const mockListProps: { data: unknown; renderItem: unknown }[] = []

// The node test runner cannot load gorhom (Reanimated). The sheet renders
// its content only while presented, and the list renders one row per item.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  return {
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    BottomSheetFlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: unknown[]
      renderItem: (info: { item: unknown }) => React.ReactNode
      keyExtractor: (item: unknown) => string
    }) => {
      mockListProps.push({ data, renderItem })
      return data.map((item) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: keyExtractor(item) },
          renderItem({ item }),
        ),
      )
    },
  }
})
jest.mock('../Sheet', () => {
  const ReactActual = jest.requireActual('react')
  return {
    Sheet: ({
      ref,
      children,
      ...props
    }: {
      ref: React.Ref<unknown>
      children: React.ReactNode
    }) => {
      const [open, setOpen] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setOpen(true),
        dismiss: () => setOpen(false),
      }))
      return open ? ReactActual.createElement('Sheet', props, children) : null
    },
  }
})
jest.mock('../ContentColumn', () => ({
  useSheetMargins: () => ({ marginHorizontal: 12 }),
}))
jest.mock('../AccountListItem', () => ({ AccountListItem: 'AccountListItem' }))
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({
    useAccountStorage: () => ({
      sortedAccountsForNetType: mockSortedAccountsForNetType,
      currentAccount: { address: 'a1' },
      setCurrentAccount: mockSetCurrentAccount,
    }),
  }),
  { virtual: true },
)

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const accounts = [{ address: 'a1' }, { address: 'a2' }] as CSAccount[]

const setup = () => {
  const ref = React.createRef<AccountSelectorRef>()
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <AccountSelector ref={ref}>screen</AccountSelector>,
    )
  })
  const rows = () =>
    renderer.root.findAllByType(
      'AccountListItem' as unknown as React.ElementType,
    )
  return { ref, renderer, rows }
}

beforeEach(() => {
  mockSetCurrentAccount.mockClear()
  mockSortedAccountsForNetType.mockReset()
  mockSortedAccountsForNetType.mockReturnValue(accounts)
  mockListProps.length = 0
})

describe('AccountSelector', () => {
  it('renders the children and keeps the sheet closed', () => {
    const { renderer, rows } = setup()
    expect(renderer.toJSON()).toBe('screen')
    expect(rows()).toHaveLength(0)
  })

  it('shows all accounts and marks the current one as selected', () => {
    const { ref, renderer, rows } = setup()
    act(() => ref.current?.show())

    const sheet = renderer.root.findByType(
      'Sheet' as unknown as React.ElementType,
    )
    expect(sheet.props.style).toEqual({ marginHorizontal: 12 })
    expect(mockSortedAccountsForNetType).toHaveBeenLastCalledWith('all')
    expect(rows().map((r) => [r.props.selected, r.props.disabled])).toEqual([
      [true, true],
      [false, false],
    ])
  })

  it('shows one net type, and all accounts for a gesture event', () => {
    const { ref } = setup()
    act(() => ref.current?.showAccountTypes(1)())
    expect(mockSortedAccountsForNetType).toHaveBeenLastCalledWith(1)

    act(() => ref.current?.show({ bubbles: true } as never))
    expect(mockSortedAccountsForNetType).toHaveBeenLastCalledWith('all')
  })

  it('makes a picked account current and closes the sheet', () => {
    const { ref, rows } = setup()
    act(() => ref.current?.show())
    act(() => {
      rows()[1].props.onPress(accounts[1])
    })

    expect(mockSetCurrentAccount).toHaveBeenCalledWith(accounts[1])
    expect(rows()).toHaveLength(0)
  })

  it('keeps the list data and row renderer when the screen re-renders', () => {
    // The storage hands back a new sorted array on each call
    mockSortedAccountsForNetType.mockImplementation(() => [...accounts])
    const { ref, renderer } = setup()
    act(() => ref.current?.show())
    act(() => {
      renderer.update(<AccountSelector ref={ref}>next screen</AccountSelector>)
    })

    const [before, after] = mockListProps.slice(-2)
    expect(after.data).toBe(before.data)
    expect(after.renderItem).toBe(before.renderItem)
  })

  it('hands every row the same press handler', () => {
    const { ref, rows } = setup()
    act(() => ref.current?.show())

    const [first, second] = rows()
    expect(first.props.onPress).toBe(second.props.onPress)
  })
})

describe('isGesture', () => {
  it('tells a gesture event from a net type', () => {
    expect(isGesture({ bubbles: true } as never)).toBe(true)
    expect(isGesture('all')).toBe(false)
    expect(isGesture(undefined)).toBe(false)
  })
})
