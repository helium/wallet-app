/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import { Trans } from 'react-i18next'
import { TextProps } from '@shopify/restyle'
import Text from './Text'
import { Theme } from '../theme/theme'

const components = {
  b: <Text fontWeight="700" />,
  errorText: <Text color="error" />,
  primaryText: <Text color="primaryText" />,
  secondaryText: <Text color="secondaryText" />,
}

type Props = TextProps<Theme> & {
  i18nKey: string
  values?: Record<string, unknown>
  numberOfLines?: number
  adjustsFontSizeToFit?: boolean
  maxFontSizeMultiplier?: number
}
const TextTransform = ({ i18nKey, values, ...props }: Props) => {
  return (
    <Text {...props}>
      <Trans i18nKey={i18nKey} components={components} values={values} />
    </Text>
  )
}
export default TextTransform
