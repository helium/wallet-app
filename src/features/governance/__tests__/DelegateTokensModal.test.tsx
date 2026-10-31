import { PortalHost, PortalProvider } from '@gorhom/portal'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { DelegateTokensModal } from '../DelegateTokensModal'

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigation keeps the check of @react-navigation/core
// useNavigation: it throws when no navigator or container is above it. The
// modal renders in the GovernancePortalHost, outside the NavigationContainer.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?",
    )
  },
}))

jest.mock('@helium/voter-stake-registry-hooks', () => {
  const subDaos = {
    loading: false,
    error: undefined,
    result: [
      {
        pubkey: { equals: () => false, toString: () => 'mobile' },
        dntMetadata: { name: 'Helium Mobile', json: { image: 'mobile.png' } },
      },
      {
        pubkey: { equals: () => false, toString: () => 'iot' },
        dntMetadata: { name: 'Helium IOT', json: { image: 'iot.png' } },
      },
    ],
  }
  const burnSplit = { data: undefined }
  const delegationSplit = { data: undefined, isLoading: false }
  return {
    useSubDaos: () => subDaos,
    useDataBurnSplit: () => burnSplit,
    useSubDaoDelegationSplit: () => delegationSplit,
  }
})
jest.mock(
  '@storage/GovernanceProvider',
  () => {
    const governance = { voteService: undefined }
    return { useGovernance: () => governance }
  },
  { virtual: true },
)
jest.mock('@utils/solanaUtils', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ FADE_IN: {} }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('../SplitBar', () => ({ SplitBar: 'SplitBar' }))
jest.mock('../components/AutomationFeesWidget', () => ({
  AutomationFeesWidget: 'AutomationFeesWidget',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  ScrollView: 'ScrollView',
  Platform: { OS: 'ios' },
  StyleSheet: { absoluteFill: {} },
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: () => 'AnimatedBlurView' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ X: 'X' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const noop = () => {}

describe('DelegateTokensModal', () => {
  // PositionCard and PositionsScreen render it in the GovernancePortalHost,
  // which GovernanceNavigator puts after its native stack: outside the
  // NavigationContainer of the screens.
  it('renders its sub DAOs and submit button in the governance portal host outside a NavigationContainer', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(
        <PortalProvider>
          <DelegateTokensModal
            onClose={noop}
            onSubmit={() => Promise.resolve()}
            onSetAutomationEnabled={noop}
            automationEnabled
            insufficientBalance={false}
            subDao={null}
            setSubDao={noop}
          />
          <PortalHost name="GovernancePortalHost" />
        </PortalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')
    // PortalHost is a memo component: find it by its name prop.
    const [host] = renderer.root.findAll(
      (n) => n.props.name === 'GovernancePortalHost',
    )

    expect(
      host.findAll((n) => n.props.testID === 'DelegateTokens.SubDao'),
    ).toHaveLength(2)
    expect(
      host.findAll((n) => n.props.testID === 'DelegateTokens.Submit'),
    ).not.toHaveLength(0)
  })
})
