import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  SIMULATION_TIMEOUT_MS,
  WalletSignBottomSheetSimulated,
} from '../WalletSIgnBottomSheetSimulated'
import { WalletStandardMessageTypes } from '../walletSignBottomSheetTypes'

// The simulation query's state, as react-query 5 reports it
type MockSimulation = {
  data: unknown
  error: Error | null
  isLoading: boolean
  isPending: boolean
}
// One simulated transaction with the 5000-lamport base fee and no
// priority fee.
const returnedSimulation: MockSimulation = {
  data: [{ solFee: 5000, priorityFee: 0, warnings: [] }],
  error: null,
  isLoading: false,
  isPending: false,
}
// A query in flight has no data and no error yet
const pendingSimulation: MockSimulation = {
  data: undefined,
  error: null,
  isLoading: true,
  isPending: true,
}
// A query still waiting to be enabled is pending but not loading
const disabledSimulation: MockSimulation = {
  data: undefined,
  error: null,
  isLoading: false,
  isPending: true,
}
let mockSimulation = returnedSimulation
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === 'walletSignSimulation' ? mockSimulation : { data: [] },
}))
// The real formatter, with the separators of an en-US locale.
jest.mock(
  '@utils/formatting',
  () => jest.requireActual('../../utils/formatting'),
  { virtual: true },
)
jest.mock('../../utils/i18n', () => ({
  groupSeparator: ',',
  decimalSeparator: '.',
}))
jest.mock('@helium/helium-react-hooks', () => ({
  useSolOwnedAmount: () => ({ amount: undefined }),
}))
jest.mock('@helium/helium-entity-manager-sdk', () => ({
  entityCreatorKey: () => [],
}))
jest.mock('@helium/sus', () => ({ sus: () => Promise.resolve([]) }))
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
jest.mock(
  '@hooks/useRentExempt',
  () => ({ useRentExempt: () => ({ rentExempt: '', rentExemptLamports: 0 }) }),
  { virtual: true },
)
jest.mock('@utils/constants', () => ({ DAO_KEY: undefined }), {
  virtual: true,
})
jest.mock('@ui/SubmitButton', () => ({ SubmitButton: 'SubmitButton' }), {
  virtual: true,
})
jest.mock('@ui/WarningPill', () => ({ WarningPill: 'WarningPill' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock(
  '@ui/twMerge',
  () => ({ twMerge: (...classes: unknown[]) => classes.join(' ') }),
  { virtual: true },
)
jest.mock('../canopyBlacklist', () => ({ fetchCanopyBlacklist: () => [] }))
jest.mock('../SolanaProvider', () => ({
  useSolana: () => ({ connection: undefined, cluster: 'mainnet-beta' }),
}))
jest.mock('../WalletSignBottomSheetTransaction', () => ({
  __esModule: true,
  default: 'WalletSignBottomSheetTransaction',
}))
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  CornerDownRight: 'CornerDownRight',
  Info: 'Info',
  X: 'X',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-gesture-handler', () => ({ ScrollView: 'ScrollView' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('WalletSignBottomSheetSimulated', () => {
  afterEach(() => {
    mockSimulation = returnedSimulation
  })

  it('shows a fee under 0.0001 SOL at full precision', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          opened
          onAccept={() => {}}
          onCancel={() => {}}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toContain('~0.000005 SOL')
  })

  it('wires Cancel to onCancel and Approve to onAccept', () => {
    const onAccept = jest.fn()
    const onCancel = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          opened
          onAccept={onAccept}
          onCancel={onCancel}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const buttonWithText = (label: string) =>
      root.find(
        (n) => (n.type as unknown) === 'Button' && n.props.children === label,
      )

    act(() => {
      buttonWithText('browserScreen.cancel').props.onPress()
    })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onAccept).not.toHaveBeenCalled()

    onCancel.mockClear()
    act(() => {
      buttonWithText('browserScreen.approve').props.onPress()
    })
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  describe('Approve', () => {
    // A pending simulation starts the timeout's timer
    beforeEach(() => {
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.useRealTimers()
    })

    const renderSheet = (
      props: Partial<
        React.ComponentProps<typeof WalletSignBottomSheetSimulated>
      > = {},
    ) => {
      let renderer: TestRenderer.ReactTestRenderer | undefined
      act(() => {
        renderer = TestRenderer.create(
          <WalletSignBottomSheetSimulated
            type={WalletStandardMessageTypes.signTransaction}
            serializedTxs={[Buffer.from('tx')]}
            opened
            onAccept={() => {}}
            onCancel={() => {}}
            {...props}
          />,
        )
      })
      if (!renderer) throw new Error('render failed')
      return renderer
    }
    const approveDisabled = (
      renderer: TestRenderer.ReactTestRenderer,
      label = 'browserScreen.approve',
    ) =>
      renderer.root.find(
        (n) => (n.type as unknown) === 'Button' && n.props.children === label,
      ).props.disabled

    it('stays disabled until the open animation ends', () => {
      const renderer = renderSheet({ opened: false })
      expect(approveDisabled(renderer)).toBe(true)

      act(() => {
        renderer.update(
          <WalletSignBottomSheetSimulated
            type={WalletStandardMessageTypes.signTransaction}
            serializedTxs={[Buffer.from('tx')]}
            opened
            onAccept={() => {}}
            onCancel={() => {}}
          />,
        )
      })
      expect(approveDisabled(renderer)).toBe(false)
    })

    it('keeps the swipe to approve disabled until the open animation ends', () => {
      mockSimulation = {
        ...returnedSimulation,
        data: [
          {
            solFee: 5000,
            priorityFee: 0,
            warnings: [{ severity: 'critical' }],
          },
        ],
      }
      const swipeDisabled = (renderer: TestRenderer.ReactTestRenderer) =>
        renderer.root.find((n) => (n.type as unknown) === 'SubmitButton').props
          .disabled

      expect(swipeDisabled(renderSheet({ opened: false }))).toBe(true)
      expect(swipeDisabled(renderSheet())).toBe(false)
    })

    it('stays disabled while the simulation is pending', () => {
      mockSimulation = pendingSimulation

      expect(approveDisabled(renderSheet())).toBe(true)
    })

    it('stays disabled while the simulation waits to be enabled', () => {
      mockSimulation = disabledSimulation

      expect(approveDisabled(renderSheet())).toBe(true)
    })

    describe('when the simulation fails', () => {
      const failedSimulation: MockSimulation = {
        data: undefined,
        error: new Error('Simulation failed'),
        isLoading: false,
        isPending: false,
      }
      const texts = (renderer: TestRenderer.ReactTestRenderer) =>
        renderer.root
          .findAllByType('Text' as never)
          .map((n) => n.props.children)
      const approveWithoutSimulationButtons = (
        renderer: TestRenderer.ReactTestRenderer,
      ) =>
        renderer.root.findAll(
          (n) =>
            (n.type as unknown) === 'Button' &&
            n.props.children === 'browserScreen.approveWithoutSimulation',
        )

      it('keeps a dApp request disabled under the caution until the user approves without simulation', () => {
        mockSimulation = failedSimulation
        const renderer = renderSheet({ url: 'https://dapp.example' })

        expect(approveDisabled(renderer)).toBe(true)
        expect(texts(renderer)).toContain('browserScreen.unableToSimulate')
        expect(texts(renderer)).toContain('Simulation failed')

        act(() => {
          approveWithoutSimulationButtons(renderer)[0].props.onPress()
        })
        expect(approveDisabled(renderer)).toBe(false)
        expect(approveWithoutSimulationButtons(renderer)).toHaveLength(0)
        expect(texts(renderer)).toContain('browserScreen.unableToSimulate')
      })

      it('enables an in-app request at once', () => {
        mockSimulation = failedSimulation
        const renderer = renderSheet({ url: '' })

        expect(approveDisabled(renderer)).toBe(false)
        expect(approveWithoutSimulationButtons(renderer)).toHaveLength(0)
      })

      it('needs the step again for a new dApp request', () => {
        mockSimulation = failedSimulation
        const renderer = renderSheet({ url: 'https://dapp.example' })
        act(() => {
          approveWithoutSimulationButtons(renderer)[0].props.onPress()
        })
        expect(approveDisabled(renderer)).toBe(false)

        act(() => {
          renderer.update(
            <WalletSignBottomSheetSimulated
              type={WalletStandardMessageTypes.signTransaction}
              url="https://dapp.example"
              serializedTxs={[Buffer.from('another tx')]}
              opened
              onAccept={() => {}}
              onCancel={() => {}}
            />,
          )
        })
        expect(approveDisabled(renderer)).toBe(true)
        expect(approveWithoutSimulationButtons(renderer)).toHaveLength(1)
      })

      it('offers no step for a dApp request whose simulation returned or is pending', () => {
        const returned = renderSheet({ url: 'https://dapp.example' })
        mockSimulation = pendingSimulation
        const pending = renderSheet({ url: 'https://dapp.example' })

        expect(approveWithoutSimulationButtons(returned)).toHaveLength(0)
        expect(approveWithoutSimulationButtons(pending)).toHaveLength(0)
        expect(texts(returned)).not.toContain('browserScreen.unableToSimulate')
        expect(texts(pending)).not.toContain('browserScreen.unableToSimulate')
      })
    })

    it('does not wait for a simulation when the request has no transactions', () => {
      mockSimulation = pendingSimulation

      expect(
        approveDisabled(
          renderSheet({
            type: WalletStandardMessageTypes.connect,
            serializedTxs: undefined,
          }),
          'browserScreen.connect',
        ),
      ).toBe(false)
    })

    it('does not wait when the request has no transactions, even while the query is pending', () => {
      mockSimulation = pendingSimulation
      const renderer = renderSheet({ serializedTxs: undefined })

      expect(approveDisabled(renderer)).toBe(false)
      expect(
        renderer.root
          .findAllByType('Text' as never)
          .map((n) => n.props.children),
      ).not.toContain('browserScreen.unableToSimulate')
    })

    describe('when the simulation never returns', () => {
      it('enables after the simulation times out, and says it could not simulate', () => {
        mockSimulation = pendingSimulation
        const renderer = renderSheet()
        const texts = () =>
          renderer.root
            .findAllByType('Text' as never)
            .map((n) => n.props.children)

        const spinners = () => renderer.root.findAllByType('Spinner' as never)

        act(() => {
          jest.advanceTimersByTime(SIMULATION_TIMEOUT_MS - 1)
        })
        expect(approveDisabled(renderer)).toBe(true)
        expect(texts()).not.toContain('browserScreen.unableToSimulate')
        expect(spinners()).toHaveLength(1)

        act(() => {
          jest.advanceTimersByTime(1)
        })
        expect(approveDisabled(renderer)).toBe(false)
        expect(texts()).toContain('browserScreen.unableToSimulate')
        expect(spinners()).toHaveLength(0)
      })

      it('a timeout counts only while the simulation is pending', () => {
        const serializedTxs = [Buffer.from('tx')]
        const renderer = renderSheet({ serializedTxs })
        act(() => {
          jest.advanceTimersByTime(SIMULATION_TIMEOUT_MS + 1)
        })

        mockSimulation = pendingSimulation
        act(() => {
          renderer.update(
            <WalletSignBottomSheetSimulated
              type={WalletStandardMessageTypes.signTransaction}
              serializedTxs={serializedTxs}
              opened
              onAccept={() => {}}
              onCancel={() => {}}
            />,
          )
        })
        expect(approveDisabled(renderer)).toBe(true)
        expect(
          renderer.root
            .findAllByType('Text' as never)
            .map((n) => n.props.children),
        ).not.toContain('browserScreen.unableToSimulate')
      })

      it('waits again for a new request after a timeout', () => {
        mockSimulation = pendingSimulation
        const renderer = renderSheet()
        act(() => {
          jest.advanceTimersByTime(SIMULATION_TIMEOUT_MS)
        })
        expect(approveDisabled(renderer)).toBe(false)

        act(() => {
          renderer.update(
            <WalletSignBottomSheetSimulated
              type={WalletStandardMessageTypes.signTransaction}
              serializedTxs={[Buffer.from('another tx')]}
              opened
              onAccept={() => {}}
              onCancel={() => {}}
            />,
          )
        })
        expect(approveDisabled(renderer)).toBe(true)
      })
    })
  })
})
