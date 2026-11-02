import useHaptic from '@hooks/useHaptic'
import React, { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'
import { Keypad, type KeypadInput } from './Keypad'
import { PIN_LENGTH, PinDisplay } from './PinDisplay'
import { PressableScale } from './PressableScale'
import { Text } from './Text'

export type ConfirmPinViewProps = {
  originalPin: string
  title: string
  subtitle: string
  pinSuccess: (pin: string) => void
  onCancel?: () => void
  // shows a clear key and a sign-out link in place of the cancel key
  clearable?: boolean
}

// Asks for the PIN on a keypad. A wrong PIN shakes the dots and clears them.
export const ConfirmPinView = ({
  title,
  subtitle,
  pinSuccess,
  originalPin,
  onCancel,
  clearable,
}: ConfirmPinViewProps) => {
  const { triggerImpact } = useHaptic()
  const [pin, setPin] = useState('')
  const [shakeAnim] = useState(() => new Animated.Value(0))
  const { t } = useTranslation()

  const pinFailure = () => {
    const move = (toValue: number) =>
      Animated.timing(shakeAnim, {
        toValue,
        duration: 85,
        useNativeDriver: true,
      })

    Animated.sequence([
      move(-15),
      move(15),
      move(-15),
      move(15),
      move(0),
    ]).start(() => setPin(''))

    triggerImpact()
  }

  const onPinComplete = useEffectEvent((completedPin: string) => {
    if (originalPin === completedPin) {
      pinSuccess(completedPin)
    } else {
      pinFailure()
    }
  })

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      onPinComplete(pin)
    }
  }, [pin])

  const handlePress = (input?: KeypadInput) => {
    if (typeof input === 'number') {
      setPin((val) => (val.length < PIN_LENGTH ? val + input : val))
    } else if (input === 'backspace') {
      setPin((val) => val.slice(0, -1))
    } else if (input === 'clear') {
      setPin('')
    } else {
      onCancel?.()
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className="flex-1" />
      <Text
        size="4xl"
        className="mb-4 font-semibold"
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
      <Text size="base" maxFontSizeMultiplier={1.2}>
        {subtitle}
      </Text>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <PinDisplay length={pin.length} className="my-8" />
      </Animated.View>
      <Keypad
        className="flex-[2]"
        customButtonType={clearable ? 'clear' : 'cancel'}
        onPress={handlePress}
      />
      <View className="items-center">
        {clearable && onCancel && (
          <PressableScale feedback="opacity" className="p-6" onPress={onCancel}>
            <Text size="base">{t('auth.signOut')}</Text>
          </PressableScale>
        )}
      </View>
      <View className="flex-1" />
    </View>
  )
}
