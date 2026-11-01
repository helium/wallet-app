import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { VoteOption } from '../VoteOption'

jest.mock('@helium/voter-stake-registry-hooks', () => ({
  useKnownProxy: () => ({ knownProxy: undefined }),
}))
jest.mock('@utils/formatting', () => ({ shortenAddress: (a: string) => a }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const option = { index: 0, name: 'Yes', weight: '0', percent: 0 } as never

// A vote that stays pending until the test settles it, as a wallet approval
// and a confirmation do.
const pendingVote = () => {
  let settle!: () => void
  const promise = new Promise<void>((resolve) => {
    settle = resolve
  })
  return { promise, settle }
}

const render = (props: Partial<React.ComponentProps<typeof VoteOption>>) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <VoteOption
        option={option}
        canVote={false}
        canRelinquishVote={false}
        voting={false}
        {...props}
      />,
    )
  })
  return renderer.root.findByType('PressableScale' as never)
}

describe('VoteOption', () => {
  it.each([
    ['vote', { canVote: true }, 'onVote'],
    ['relinquish', { canRelinquishVote: true }, 'onRelinquishVote'],
  ] as const)(
    'sends one %s for two presses before the first settles',
    async (_label, flags, handler) => {
      const first = pendingVote()
      const send = jest
        .fn<Promise<void>, []>()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue(undefined)
      const pressable = render({ ...flags, [handler]: send })

      act(() => {
        pressable.props.onPress()
        pressable.props.onPress()
      })
      expect(send).toHaveBeenCalledTimes(1)

      // Once the first call settles, the option takes a new press.
      await act(async () => {
        first.settle()
        await first.promise
      })
      act(() => {
        pressable.props.onPress()
      })
      expect(send).toHaveBeenCalledTimes(2)
    },
  )
})
