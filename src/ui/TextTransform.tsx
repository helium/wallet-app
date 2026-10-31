import React from 'react'
import { Trans } from 'react-i18next'
import { Text as RNText } from 'react-native'
import { Text, type TextProps } from './Text'

// Markup tags a translation can use. Each tag sets only a colour or weight, so
// it keeps the size of the text around it.
const components = {
  b: <RNText className="font-bold" />,
  errorText: <RNText className="text-destructive" />,
  primaryText: <RNText className="text-foreground" />,
  secondaryText: <RNText className="text-muted-foreground" />,
  havelockBlue: <RNText className="text-blue-dark-500" />,
  jazzberryJam: <RNText className="text-destructive" />,
  red500: <RNText className="text-destructive" />,
  greenBright500: <RNText className="text-success-500" />,
  blueBright500: <RNText className="text-blue-dark-500" />,
  caribbeanGreen: <RNText className="text-success-500" />,
  codeHighlight: (
    <RNText className="bg-secondary font-light text-muted-foreground" />
  ),
}

export type TextTransformProps = TextProps & {
  i18nKey: string
  values?: Record<string, unknown>
}

// A translation with markup tags (`<b>`, `<secondaryText>`) in one text.
export const TextTransform = ({
  i18nKey,
  values,
  ...props
}: TextTransformProps) => (
  <Text {...props}>
    <Trans i18nKey={i18nKey} components={components} values={values} />
  </Text>
)
