import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SusResult } from '@helium/sus'
import WalletSignBottomSheetTransaction from '../WalletSignBottomSheetTransaction'

// The cNFT's metadata JSON names its image.
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === 'metadataJson' && queryKey[1] === 'https://x/cnft.json'
      ? { data: { image: 'https://x/cnft.png' } }
      : { data: undefined },
}))
jest.mock('@hooks/useMetaplexMetadata', () => ({ getMetadata: jest.fn() }), {
  virtual: true,
})
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
// The node test runner cannot load react-native or expo-image. The host
// components render as named elements so the test reads their props. RN Image
// has its own name, so a render through it does not count as the app Image.
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('react-native', () => ({
  View: 'View',
  Image: 'RNImage',
  Linking: { openURL: () => Promise.resolve() },
}))
jest.mock('@ui/Pill', () => ({ Pill: 'Pill' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../CollapsibleWritableAccountPreview', () => ({
  CollapsibleWritableAccountPreview: 'CollapsibleWritableAccountPreview',
}))
jest.mock('../WarningBox', () => ({ WarningBox: 'WarningBox' }))
jest.mock('lucide-react-native', () => ({
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  CircleHelp: 'CircleHelp',
  ExternalLink: 'ExternalLink',
  TriangleAlert: 'TriangleAlert',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// A simulated transaction that can change one cNFT and no other account.
const transaction = {
  warnings: [],
  writableAccounts: [],
  instructions: [],
  possibleCNftChanges: [
    {
      id: 'cnft1',
      content: { json_uri: 'https://x/cnft.json', metadata: { name: 'Mouse' } },
    },
  ],
  explorerLink: 'https://explorer/tx',
} as unknown as SusResult

describe('WalletSignBottomSheetTransaction', () => {
  it('shows a changeable cNFT image through the app Image', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetTransaction
          transaction={transaction}
          transactionIdx={0}
          totalTransactions={1}
        />,
      )
    })

    const image = renderer.root.findByType('Image' as never)
    expect(image.props.source).toEqual({ uri: 'https://x/cnft.png' })
    expect(image.props.className).toBe('size-6')
  })

  it('hides the unknown accounts when the toggle is pressed twice before a render', () => {
    // One unowned account with only an "Unchanged" warning, so it collapses.
    const address = { toBase58: () => 'acct1' }
    const withUnknownAccount = {
      ...transaction,
      possibleCNftChanges: [],
      writableAccounts: [
        {
          address,
          name: 'Unknown Account',
          pre: { type: 'Unknown' },
          post: { type: 'Unknown' },
        },
      ],
      warnings: [{ account: address, shortMessage: 'Unchanged' }],
    } as unknown as SusResult
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetTransaction
          transaction={withUnknownAccount}
          transactionIdx={0}
          totalTransactions={1}
        />,
      )
    })
    const previews = () =>
      renderer.root.findAllByType('CollapsibleWritableAccountPreview' as never)
    const toggle = () =>
      renderer.root.find(
        (n) =>
          (n.type as unknown) === 'PressableScale' &&
          n.findAll((c) => c.props.text === 'Unknown Changes').length > 0,
      ).props.onPress
    const onPress = toggle()

    act(() => {
      onPress()
      onPress()
    })
    expect(previews().length).toBe(0)

    act(() => {
      toggle()()
    })
    expect(previews().length).toBe(1)
  })
})
