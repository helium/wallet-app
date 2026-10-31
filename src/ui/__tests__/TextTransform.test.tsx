import i18n from 'i18next'
import React from 'react'
import { initReactI18next } from 'react-i18next'
import TestRenderer, { act } from 'react-test-renderer'
import { TextTransform } from '../TextTransform'

jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
// The node test runner cannot load react-native. Text renders as a named
// element so the test reads its props.
jest.mock('react-native', () => ({
  Text: 'Text',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          fee: '<b>Fee</b> <secondaryText>{{ amount }} SOL</secondaryText>',
          error: '<errorText>Failed</errorText>',
        },
      },
    },
    interpolation: { escapeValue: false },
  })
})

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

const texts = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('Text' as unknown as React.ElementType)

describe('TextTransform', () => {
  it('renders the outer text with the caller size and className', () => {
    const [outer] = texts(
      create(
        <TextTransform
          i18nKey="fee"
          values={{ amount: 1 }}
          size="xs"
          className="mx-4 text-center"
        />,
      ),
    )

    expect(outer.props.className).toContain('text-xs')
    expect(outer.props.className).toContain('mx-4')
    expect(outer.props.className).toContain('text-center')
  })

  it('styles each markup tag with its token class', () => {
    const [, bold, secondary] = texts(
      create(<TextTransform i18nKey="fee" values={{ amount: 0.5 }} />),
    )

    expect(bold.props.className).toBe('font-bold')
    expect(bold.props.children).toEqual(['Fee'])
    expect(secondary.props.className).toBe('text-muted-foreground')
    expect(secondary.props.children).toEqual(['0.5 SOL'])
  })

  it('renders the error tag in the destructive colour', () => {
    const [, error] = texts(create(<TextTransform i18nKey="error" />))

    expect(error.props.className).toBe('text-destructive')
    expect(error.props.children).toEqual(['Failed'])
  })
})
