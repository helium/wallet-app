import { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { AssignProxyScreen } from '../AssignProxyScreen'

// A position with no proxy, so the screen lists it.
const mockPosition = {
  pubkey: new PublicKey('11111111111111111111111111111112'),
  mint: new PublicKey('SysvarRent111111111111111111111111111111111'),
  proxy: null,
}

jest.mock('react-native', () => ({
  FlatList: 'FlatList',
  View: 'View',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
}))
jest.mock('@react-native-community/slider', () => 'Slider')
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: () => {} }
  const route = { params: {} }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock(
  '@storage/GovernanceProvider',
  () => ({
    useGovernance: () => ({
      loading: false,
      positions: [mockPosition],
      refetch: () => {},
    }),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useGovernanceMutations',
  () => ({
    useAssignProxiesMutation: () => ({ submit: () => Promise.resolve() }),
  }),
  { virtual: true },
)
jest.mock('@helium/spl-utils', () => ({ truthy: (v: unknown) => !!v }))
jest.mock('@utils/sleep', () => () => Promise.resolve(), { virtual: true })
jest.mock(
  '@ui/BackScreen',
  () => ({
    BackScreen: ({ children }: { children: React.ReactNode }) => children,
  }),
  { virtual: true },
)
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../PositionPreview', () => ({ PositionPreview: 'PositionPreview' }))
jest.mock('../ProxySearch', () => ({ ProxySearch: 'ProxySearch' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('AssignProxyScreen', () => {
  it('keys each position by its address', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AssignProxyScreen />)
    })
    const list = renderer.root.findByType('FlatList' as never).props

    expect(list.data).toEqual([mockPosition])
    expect(list.keyExtractor?.(mockPosition, 0)).toBe(
      mockPosition.pubkey.toBase58(),
    )
  })
})
