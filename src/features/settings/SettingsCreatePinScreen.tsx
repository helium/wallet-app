import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Text from '../../components/Text'
import PinDisplay from '../../components/PinDisplay'
import Keypad from '../../components/Keypad'
import Box from '../../components/Box'
import { SettingsNavigationProp } from './settingsTypes'

const SettingsCreatePinScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<SettingsNavigationProp>()

  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 6) {
      navigation.navigate('SettingsConfirmPin', {
        pin,
        action: 'create',
      })
    }
  }, [pin, navigation])

  useEffect(() => {
    return navigation.addListener('blur', () => {
      setPin('')
    })
  }, [navigation])

  const handleBackspace = useCallback(() => {
    setPin((val) => val.slice(0, -1))
  }, [])

  const handleNumber = useCallback((num: number) => {
    setPin((val) => (val.length < 6 ? val + num : val))
  }, [])

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
        {t('accountSetup.createPin.title')}
      </Text>

      <Text variant="body1" maxFontSizeMultiplier={1.2}>
        {t('accountSetup.createPin.subtitle')}
      </Text>
      <PinDisplay length={pin.length} marginVertical="xl" />
      <Keypad
        onBackspacePress={handleBackspace}
        onNumberPress={handleNumber}
        onCustomButtonPress={navigation.goBack}
        customButtonTitle={t('generic.cancel')}
      />
      <Box flex={1} />
    </Box>
  )
}

export default SettingsCreatePinScreen
