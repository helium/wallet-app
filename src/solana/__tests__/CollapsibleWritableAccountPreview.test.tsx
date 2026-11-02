import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { WritableAccount } from '@helium/sus'
import { CollapsibleWritableAccountPreview } from '../CollapsibleWritableAccountPreview'

jest.mock('@assets/images/anchorAccount.svg', () => 'AnchorAccount', {
  virtual: true,
})
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined }),
}))
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    getMetadata: jest.fn(),
    useMetaplexMetadata: () => ({ json: undefined }),
  }),
  { virtual: true },
)
jest.mock('@solana/spl-token', () => ({ NATIVE_MINT: 'native' }))
jest.mock('@utils/formatting', () => ({ shortenAddress: (a: string) => a }), {
  virtual: true,
})
jest.mock('@utils/solanaUtils', () => ({ humanReadable: () => '' }), {
  virtual: true,
})
jest.mock('@ui/Pill', () => ({ Pill: 'Pill' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('../WritableAccountPreview', () => ({
  WritableAccountPreview: 'WritableAccountPreview',
}))
jest.mock('lucide-react-native', () => ({
  ArrowDownLeft: 'ArrowDownLeft',
  ArrowUpRight: 'ArrowUpRight',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  CircleHelp: 'CircleHelp',
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// An unknown account that exists before and after the transaction.
const writableAccount = {
  address: { toBase58: () => 'acct1' },
  name: 'Unknown Account',
  pre: { type: 'Unknown', account: { lamports: 1 } },
  post: { type: 'Unknown', account: { lamports: 1 } },
} as unknown as WritableAccount

describe('CollapsibleWritableAccountPreview', () => {
  it('hides the account details when pressed twice before a render', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <CollapsibleWritableAccountPreview
          writableAccount={writableAccount}
          instructions={[]}
          warnings={[]}
        />,
      )
    })
    const details = () =>
      renderer.root.findAllByType('WritableAccountPreview' as never)
    const toggle = () =>
      renderer.root.findByType('PressableScale' as never).props.onPress
    const onPress = toggle()

    act(() => {
      onPress()
      onPress()
    })
    expect(details().length).toBe(0)

    act(() => {
      toggle()()
    })
    expect(details().length).toBe(1)
  })
})
