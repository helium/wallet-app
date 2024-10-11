/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ResponsiveValue, TextProps } from '@shopify/restyle'
import { TextVariant, Theme } from '@theme/theme'
import Text from './Text'

const getComponents = (variant?: ResponsiveValue<TextVariant, Theme>) => ({
  b: <Text fontWeight="700" variant={variant} />,
  errorText: <Text color="error.500" fontWeight="600" variant={variant} />,
  primaryText: <Text color="primaryText" variant={variant} />,
  secondaryText: <Text color="secondaryText" variant={variant} />,
  'blue.500': <Text color="blue.500" variant={variant} />,
  'pink.500': <Text color="pink.500" variant={variant} />,
  'error.500': <Text color="error.500" fontWeight="600" variant={variant} />,
  'green.light-500': <Text color="green.light-500" variant={variant} />,
  'blue.light-500': <Text color="blue.light-500" variant={variant} />,
  'green.400': <Text color="green.400" variant={variant} />,
  codeHighlight: (
    <Text
      color="gray.500"
      fontWeight="300"
      style={{
        backgroundColor: '#D9D9D9',
      }}
      variant={variant}
    />
  ),
})

type Props = TextProps<Theme> & {
  i18nKey: string
  values?: Record<string, unknown>
  numberOfLines?: number
  adjustsFontSizeToFit?: boolean
  maxFontSizeMultiplier?: number
  colorTextVariant?: ResponsiveValue<TextVariant, Theme>
}

const TextTransform = ({
  i18nKey,
  values,
  colorTextVariant,
  ...props
}: Props) => {
  const components = useMemo(
    () => getComponents(colorTextVariant),
    [colorTextVariant],
  )
  return (
    <Text {...props}>
      <Trans i18nKey={i18nKey} components={components} values={values} />
    </Text>
  )
}
export default TextTransform
