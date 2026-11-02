import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import TransactionLineItem from '../TransactionLineItem'

// @react-navigation ships ESM only, which this jest config does not
// transform. The line item reads the navigation object only on a long press.
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}) }))
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@hooks/useAlert', () => () => ({ showOKCancelAlert: () => {} }), {
  virtual: true,
})
jest.mock('@hooks/useCopyText', () => () => () => {}, { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = { contacts: [], sortedAccounts: [] }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../../../utils/accountUtils', () => ({
  ellipsizeAddress: (a: string) => a,
}))
jest.mock('../../../utils/i18n', () => ({ locale: 'en' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Linking: { openURL: () => Promise.resolve() },
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ChevronRight: 'ChevronRight' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// React Native throws "Text strings must be rendered within a <Text>
// component" for a string or number child of a View. The test renderer does
// not, so this lists those children.
const textInView = (
  node: TestRenderer.ReactTestRendererJSON | string | null,
): string[] => {
  if (!node || typeof node === 'string') return []
  return (node.children || []).flatMap((child) =>
    typeof child === 'string'
      ? node.type === 'View'
        ? [`<${node.type}> ${child}`]
        : []
      : textInView(child),
  )
}

const render = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

describe('TransactionLineItem', () => {
  it('shows a bodyTextEnd of 0 as 0 in a Text', () => {
    const renderer = render(
      <TransactionLineItem title="Fee" bodyText="1 HNT" bodyTextEnd={0} />,
    )

    expect(
      renderer.root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toContain(0)
    expect(textInView(renderer.toJSON() as never)).toEqual([])
  })

  it('shows a non-empty bodyTextEnd and hides an empty one', () => {
    const texts = (bodyTextEnd: string) =>
      render(
        <TransactionLineItem
          title="Fee"
          bodyText="1 HNT"
          bodyTextEnd={bodyTextEnd}
        />,
      )
        .root.findAllByType('Text' as never)
        .map((n) => n.props.children)

    expect(texts('$5')).toEqual(['Fee', '1 HNT', '$5'])
    expect(texts('')).toEqual(['Fee', '1 HNT'])
  })

  it('groups a numeric bodyText for the device locale', () => {
    const texts = render(
      <TransactionLineItem title="Amount" bodyText={1234567.5} />,
    )
      .root.findAllByType('Text' as never)
      .map((n) => n.props.children)

    expect(texts).toEqual(['Amount', '1,234,567.5'])
  })
})
