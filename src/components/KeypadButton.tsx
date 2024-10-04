/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback } from 'react'
import { Pressable } from 'react-native'
import Backspace from '@assets/images/backspace.svg'
import { useTranslation } from 'react-i18next'
import { useColors, useHitSlop, useOpacity } from '@theme/themeHooks'
import Box from './Box'
import Text from './Text'
import { decimalSeparator } from '../utils/i18n'

export type KeypadCustomInput = 'clear' | 'decimal' | 'cancel'
export type KeypadInput = number | 'backspace' | KeypadCustomInput
type Props = {
  value?: KeypadInput
  onPress?: (value?: KeypadInput) => void
}

const KeypadButton = ({ value, onPress }: Props) => {
  const { backgroundStyle: goldBackgroundStyle } = useOpacity(
    'yellow.500',
    0.29,
  )
  const colors = useColors()
  const { t } = useTranslation()
  const hitSlop = useHitSlop('4')

  const getBackgroundColorStyle = useCallback(
    (pressed: boolean) => {
      if (pressed) {
        return goldBackgroundStyle
      }
      return { backgroundColor: 'transparent' }
    },
    [goldBackgroundStyle],
  )

  const handlePress = useCallback(() => onPress?.(value), [onPress, value])

  const body = useCallback(
    (pressed: boolean) => {
      if (typeof value === 'number') {
        return (
          <Text
            variant="displayMdRegular"
            minimumFontScale={0.7}
            adjustsFontSizeToFit
            numberOfLines={1}
            color={pressed ? 'yellow.500' : 'secondaryText'}
          >
            {value}
          </Text>
        )
      }

      switch (value) {
        case 'backspace':
          return (
            <Box
              height="100%"
              aspectRatio={1}
              alignContent="center"
              justifyContent="center"
              alignItems="center"
            >
              <Backspace
                color={pressed ? colors['yellow.500'] : colors.secondaryText}
              />
            </Box>
          )
        case 'decimal':
          return (
            <Text
              variant="displayMdRegular"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'yellow.500' : 'secondaryText'}
            >
              {decimalSeparator}
            </Text>
          )
        case 'clear':
          return (
            <Text
              variant="textMdRegular"
              width="100%"
              textAlign="center"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'yellow.500' : 'secondaryText'}
            >
              {t('generic.clear')}
            </Text>
          )
        case 'cancel':
          return (
            <Text
              variant="textMdRegular"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'yellow.500' : 'secondaryText'}
            >
              {t('generic.cancel')}
            </Text>
          )
      }
    },
    [colors, t, value],
  )
  return (
    <Box flexBasis="33%" alignItems="center" justifyContent="center">
      <Pressable onPressIn={handlePress} disabled={!value && value !== 0}>
        {({ pressed }) => (
          <Box
            alignItems="center"
            justifyContent="center"
            style={getBackgroundColorStyle(pressed)}
            height="100%"
            width="100%"
            aspectRatio={1}
            borderRadius="full"
            maxWidth={80}
            maxHeight={80}
            hitSlop={hitSlop}
          >
            {body(pressed)}
          </Box>
        )}
      </Pressable>
    </Box>
  )
}

export default KeypadButton
