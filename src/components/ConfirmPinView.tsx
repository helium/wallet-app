import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import useHaptic from '@hooks/useHaptic'
import Text from './Text'
import PinDisplay from './PinDisplay'
import Keypad from './Keypad'
import Box from './Box'
import TouchableOpacityBox from './TouchableOpacityBox'
import { KeypadInput } from './KeypadButton'

type Props = {
  originalPin: string
  title: string
  subtitle: string
  pinSuccess: (pin: string) => void
  onCancel?: () => void
  clearable?: boolean
}
const ConfirmPinView = ({
  title,
  subtitle,
  pinSuccess,
  originalPin,
  onCancel,
  clearable,
}: Props) => {
  const { triggerImpact } = useHaptic()
  const success = useRef(false)
  const [pin, setPin] = useState('')
  const shakeAnim = useRef(new Animated.Value(0))
  const { t } = useTranslation()

  const pinFailure = useCallback(() => {
    const { current } = shakeAnim
    const move = (direction: 'left' | 'right' | 'center') => {
      let value = 0
      if (direction === 'left') value = -15
      if (direction === 'right') value = 15
      return Animated.timing(current, {
        toValue: value,
        duration: 85,
        useNativeDriver: true,
      })
    }

    Animated.sequence([
      move('left'),
      move('right'),
      move('left'),
      move('right'),
      move('center'),
    ]).start(() => setPin(''))

    triggerImpact()
  }, [triggerImpact])

  useEffect(() => {
    if (pin.length === 6) {
      if (originalPin === pin) {
        success.current = true
        pinSuccess(pin)
      } else {
        pinFailure()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  const handlePress = useCallback(
    (input?: KeypadInput) => {
      if (typeof input === 'number') {
        setPin((val) => (val.length < 6 ? val + input : val))
      } else if (input === 'backspace') {
        setPin((val) => val.slice(0, -1))
      } else if (input === 'clear') {
        setPin('')
      } else {
        onCancel?.()
      }
    },
    [onCancel],
  )

  return (
    <Box
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal="xl"
      justifyContent="center"
      alignItems="center"
    >
      <Box flex={1} />
      <Text
        marginBottom="m"
        variant="h1"
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>

      <Text variant="body1" maxFontSizeMultiplier={1.2}>
        {subtitle}
      </Text>
      <Animated.View style={{ transform: [{ translateX: shakeAnim.current }] }}>
        <PinDisplay length={pin.length} marginVertical="xl" />
      </Animated.View>
      <Keypad
        flex={2}
        customButtonType={clearable ? 'clear' : 'cancel'}
        onPress={handlePress}
      />
      <Box alignItems="center">
        {clearable && onCancel && (
          <TouchableOpacityBox padding="l" onPress={onCancel}>
            <Text variant="body1">{t('auth.signOut')}</Text>
          </TouchableOpacityBox>
        )}
      </Box>
      <Box flex={1} />
    </Box>
  )
}

export default memo(ConfirmPinView)
