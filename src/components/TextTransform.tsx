/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ResponsiveValue, TextProps } from '@shopify/restyle'
import { TextVariant, Theme } from '@theme/theme'
import Text from './Text'

const getComponents = (variant?: ResponsiveValue<TextVariant, Theme>) => ({
  b: <Text fontWeight="700" variant={variant} />,
  errorText: <Text color="error" variant={variant} />,
  primaryText: <Text color="primaryText" variant={variant} />,
  secondaryText: <Text color="secondaryText" variant={variant} />,
  havelockBlue: <Text color="havelockBlue" variant={variant} />,
  jazzberryJam: <Text color="jazzberryJam" variant={variant} />,
  red500: <Text color="red500" variant={variant} />,
  greenBright500: <Text color="greenBright500" variant={variant} />,
  blueBright500: <Text color="blueBright500" variant={variant} />,
  caribbeanGreen: <Text color="caribbeanGreen" variant={variant} />,
  codeHighlight: (
    <Text
      color="grey500"
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
