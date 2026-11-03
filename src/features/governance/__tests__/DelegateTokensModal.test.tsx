import { PortalHost, PortalProvider } from '@gorhom/portal'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { DelegateTokensModal } from '../DelegateTokensModal'

// @react-navigation ships ESM only, which this jest config does not
// transform. Here useNavigation always throws, so the test fails if the
// modal content calls it: GovernanceModal content calls no navigation hook.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?",
    )
  },
}))

// The revenue and delegation splits the hooks return. A test sets them before
// it renders; they stay unset otherwise.
const mockSplits: {
  burn?: { mobile: number; iot: number }
  delegation?: { mobile: number; iot: number }
} = {}

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
  return {
    useSubDaos: () => subDaos,
    useDataBurnSplit: () => ({ data: mockSplits.burn }),
    useSubDaoDelegationSplit: () => ({
      data: mockSplits.delegation,
      isLoading: false,
    }),
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
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
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

// React Native throws "Text strings must be rendered within a <Text>
// component" for a string or number child of a View. The test renderer does
// not, so this lists those children.
const textInView = (
  node: TestRenderer.ReactTestRendererJSON | string | null,
): string[] => {
  if (!node || typeof node === 'string') return []
  return (node.children || []).flatMap((child) =>
    typeof child === 'string'
      ? ['View', 'ScrollView'].includes(node.type)
        ? [`<${node.type}> ${child}`]
        : []
      : textInView(child),
  )
}

const renderModal = async () => {
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
  return renderer
}

afterEach(() => {
  delete mockSplits.burn
  delete mockSplits.delegation
})

describe('DelegateTokensModal', () => {
  // PositionCard and PositionsScreen render it under GovernanceWrapper, which
  // puts a GovernancePortalHost inside its own sheet provider. This test
  // gives it a bare host.
  it('renders its sub DAOs and submit button in a governance portal host', async () => {
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

  // A share under 0.01 % rounds to 0 in the percentage the modal computes:
  // 1 * 10000 / 100001 floors to 0. The IoT share, 100000 * 10000 / 100001,
  // floors to 9999, which is 99.99 % and shows as 100.0%.
  it('shows a 0 % delegation share as 0.0% without text in a View', async () => {
    mockSplits.burn = { mobile: 100, iot: 300 }
    mockSplits.delegation = { mobile: 1, iot: 100000 }
    const renderer = await renderModal()

    const delegationBar = renderer.root.find(
      (n) =>
        (n.type as unknown) === 'SplitBar' &&
        n.props.title === 'gov.automation.delegationSplit',
    )
    expect(delegationBar.props.leftValue).toBe('0.0%')
    expect(delegationBar.props.rightValue).toBe('100.0%')
    expect(textInView(renderer.toJSON() as never)).toEqual([])
  })

  it('hides the splits without text in a View when a revenue is 0', async () => {
    mockSplits.burn = { mobile: 0, iot: 300 }
    mockSplits.delegation = { mobile: 100, iot: 300 }
    const renderer = await renderModal()

    expect(renderer.root.findAllByType('SplitBar' as never)).toHaveLength(0)
    expect(textInView(renderer.toJSON() as never)).toEqual([])
  })
})
