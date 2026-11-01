import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import parseMarkup from '../parseMarkup'

const mockOpenURL = jest.fn((_url: string) => Promise.resolve())

jest.mock('react-native', () => ({
  View: 'View',
  Linking: { openURL: (url: string) => mockOpenURL(url) },
}))
jest.mock('../logger', () => ({ breadcrumb: () => {} }))
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (markup: string) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(<>{parseMarkup(markup)}</>)
  })
  if (!renderer) throw new Error('render failed')
  return renderer.root
}

const textWith = (root: TestRenderer.ReactTestInstance, child: string) =>
  root
    .findAllByType('Text' as never)
    .find((n) => [n.props.children].flat(Infinity).includes(child))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('parseMarkup', () => {
  it('opens the href of a pressed link', () => {
    const link = textWith(render('<a href="https://x.test">go</a>'), 'go')

    act(() => {
      link?.props.onPress()
    })
    expect(mockOpenURL).toHaveBeenCalledWith('https://x.test')
  })

  it.each([
    // eslint-disable-next-line no-script-url -- the scheme under test
    'javascript:alert(1)',
    'tel:+15555550100',
    'sms:+15555550100',
    'file:///etc/passwd',
    'intent://scan/#Intent;scheme=zxing;end',
    'heliumwallet://import_key/abc',
    'zcash://pay',
    'not a url',
  ])('opens nothing for a link to %s', (href) => {
    const link = textWith(render(`<a href="${href}">go</a>`), 'go')

    act(() => {
      link?.props.onPress()
    })
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('opens nothing for a link without an href', () => {
    const link = textWith(render('<a>go</a>'), 'go')

    act(() => {
      link?.props.onPress()
    })
    expect(mockOpenURL).not.toHaveBeenCalled()
  })

  it('announces a link with the link role', () => {
    const link = textWith(render('<a href="https://x.test">go</a>'), 'go')

    expect(link?.props.accessibilityRole).toBe('link')
  })

  it('renders a bullet row with its children', () => {
    const root = render('<bullet>first point</bullet>')

    const row = root.findAllByType('View' as never)[0]
    const texts = row.findAllByType('Text' as never)
    expect(texts[0].props.children).toBe('•')
    expect([texts[1].props.children].flat(Infinity)).toContain('first point')
  })

  it('gives a bullet without a color attribute no color style', () => {
    const root = render('<bullet>first point</bullet>')

    const dot = textWith(root, '•')
    expect(dot?.props.style).toBeUndefined()
  })

  it('colors a bullet from its color attribute', () => {
    const root = render('<bullet color="#f00">first point</bullet>')

    const dot = textWith(root, '•')
    expect(dot?.props.style).toEqual({ color: '#f00' })
  })

  it('renders bold text with the bold class', () => {
    const bold = textWith(render('<b>x</b>'), 'x')

    expect(bold?.props.className).toBe('font-bold')
  })
})
