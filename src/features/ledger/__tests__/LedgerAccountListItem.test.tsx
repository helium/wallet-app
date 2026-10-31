import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import LedgerAccountListItem, { Section } from '../LedgerAccountListItem'

// The real Checkbox, on a model of React Native's Pressable: a disabled
// Pressable does not call onPress.
jest.mock('@ui/Checkbox', () => jest.requireActual('../../../ui/Checkbox'), {
  virtual: true,
})
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  const Pressable = ({
    disabled,
    onPress,
    ...props
  }: {
    disabled?: boolean
    onPress?: () => void
  }) =>
    ReactActual.createElement('Pressable', {
      ...props,
      press: () => {
        if (!disabled) onPress?.()
      },
    })
  return { View: 'View', Pressable }
})
jest.mock('lucide-react-native', () => ({ Check: 'Check' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@helium/spl-utils', () => ({ toBN: () => 0 }))
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/twMerge',
  () => ({ twMerge: (...classes: unknown[]) => classes.join(' ') }),
  { virtual: true },
)
jest.mock('@utils/solanaUtils', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock('../../../utils/accountUtils', () => ({
  ellipsizeAddress: (address: string) => address,
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const account = {
  address: 'address',
  alias: 'Ledger 1',
  accountIndex: 0,
  solanaAddress: 'solana-address',
  derivationPath: "44'/501'/0'",
  balance: 0,
}

const pressCheckbox = (sectionIndex: Section) => {
  const onCheckboxToggled = jest.fn()
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(
      <LedgerAccountListItem
        item={account as never}
        isSelected={false}
        index={0}
        section={{ title: '', index: sectionIndex, data: [account as never] }}
        onCheckboxToggled={onCheckboxToggled}
      />,
    )
  })
  if (!renderer) throw new Error('render failed')
  const checkbox = renderer.root.findByType('Pressable' as never)
  act(() => {
    checkbox.props.press()
  })
  return onCheckboxToggled
}

describe('LedgerAccountListItem', () => {
  it('toggles a new account', () => {
    expect(pressCheckbox(Section.NEW_ACCOUNT)).toHaveBeenCalledWith(
      account,
      true,
    )
  })

  it('does not toggle an already-linked account', () => {
    expect(pressCheckbox(Section.ALREADY_LINKED)).not.toHaveBeenCalled()
  })
})
