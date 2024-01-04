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
  const { backgroundStyle: goldBackgroundStyle } = useOpacity('gold', 0.29)
  const { gold, surfaceSecondaryText } = useColors()
  const { t } = useTranslation()
  const hitSlop = useHitSlop('m')

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
            variant="h1"
            minimumFontScale={0.7}
            adjustsFontSizeToFit
            numberOfLines={1}
            color={pressed ? 'gold' : 'surfaceSecondaryText'}
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
              <Backspace color={pressed ? gold : surfaceSecondaryText} />
            </Box>
          )
        case 'decimal':
          return (
            <Text
              variant="h1"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'gold' : 'surfaceSecondaryText'}
            >
              {decimalSeparator}
            </Text>
          )
        case 'clear':
          return (
            <Text
              variant="body1"
              width="100%"
              textAlign="center"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'gold' : 'surfaceSecondaryText'}
            >
              {t('generic.clear')}
            </Text>
          )
        case 'cancel':
          return (
            <Text
              variant="body1"
              adjustsFontSizeToFit
              numberOfLines={1}
              color={pressed ? 'gold' : 'surfaceSecondaryText'}
            >
              {t('generic.cancel')}
            </Text>
          )
      }
    },
    [gold, surfaceSecondaryText, t, value],
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
            borderRadius="round"
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
