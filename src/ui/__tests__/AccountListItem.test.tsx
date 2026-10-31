import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { CSAccount } from '../../storage/cloudStorage'
import { AccountListItem } from '../AccountListItem'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the row press target render as named elements so the test
// reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ Check: 'Check' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../AccountIcon', () => ({ AccountIcon: 'AccountIcon' }))
jest.mock('../TouchableContainer', () => ({
  TouchableContainer: 'TouchableContainer',
}))
jest.mock(
  '@utils/accountUtils',
  () => ({
    ellipsizeAddress: (address: string) => `short(${address})`,
    formatAccountAlias: (account: { alias: string }) =>
      `alias(${account.alias})`,
  }),
  { virtual: true },
)

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

const account = {
  alias: 'Main',
  address: 'helium-addr',
  solanaAddress: 'sol-addr',
} as CSAccount

describe('AccountListItem', () => {
  it('shows the account icon, alias and short Solana address', () => {
    const renderer = create(
      <AccountListItem account={account} selected={false} />,
    )
    const [icon] = byType(renderer, 'AccountIcon')
    const texts = byType(renderer, 'Text').map((t) => t.props.children)

    expect(icon.props).toEqual({ size: 40, address: 'sol-addr' })
    expect(texts).toEqual(['alias(Main)', 'short(sol-addr)'])
    expect(byType(renderer, 'Check')).toHaveLength(0)
  })

  it('shows a check when selected', () => {
    const renderer = create(<AccountListItem account={account} selected />)
    expect(byType(renderer, 'Check')).toHaveLength(1)
  })

  it('reports the account on press and passes disabled to the row', () => {
    const onPress = jest.fn()
    const [row] = byType(
      create(
        <AccountListItem
          account={account}
          selected
          disabled
          onPress={onPress}
        />,
      ),
      'TouchableContainer',
    )

    expect(row.props.disabled).toBe(true)
    act(() => {
      row.props.onPress()
    })
    expect(onPress).toHaveBeenCalledWith(account)
  })
})
