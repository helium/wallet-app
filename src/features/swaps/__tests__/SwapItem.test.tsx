import { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SwapItem from '../SwapItem'

// The node test runner cannot load react-native or the token hooks. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('@ui/TokenPill', () => ({ TokenPill: 'TokenPill' }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
// The real Card, so the test reads its merged classes.
jest.mock('@ui/Card', () => jest.requireActual('../../../ui/Card'), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT' }) }),
  { virtual: true },
)
jest.mock('@solana/web3.js', () => ({ PublicKey: class {} }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('SwapItem', () => {
  it('draws the panel with the card radius and panel padding', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <SwapItem
          isPaying
          onCurrencySelect={() => {}}
          mintSelected={new PublicKey('')}
          amount={0}
        />,
      )
    })
    const [panel] = renderer.root.findAllByType('View' as never)
    const classes = String(panel.props.className).split(' ')

    expect(classes).toEqual(
      expect.arrayContaining(['rounded-2xl', 'px-4', 'py-[15px]']),
    )
    expect(classes).not.toContain('rounded-[20px]')
  })
})
