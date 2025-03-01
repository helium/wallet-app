import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Text from '@components/Text'
import PinDisplay from '@components/PinDisplay'
import Keypad from '@components/Keypad'
import Box from '@components/Box'
import { KeypadInput } from '@components/KeypadButton'
import { ThemeProvider } from '@shopify/restyle'
import { darkTheme } from '@config/theme/theme'
import {
  CreateAccountNavigationProp,
  CreateAccountStackParamList,
} from './create/createAccountNavTypes'
import {
  ImportAccountNavigationProp,
  ImportAccountStackParamList,
} from './import/importAccountNavTypes'

type Route = RouteProp<
  CreateAccountStackParamList & ImportAccountStackParamList,
  'AccountCreatePinScreen'
>
const AccountCreatePinScreen = () => {
  const { t } = useTranslation()
  const { params } = useRoute<Route>()
  const navigation = useNavigation<
    CreateAccountNavigationProp & ImportAccountNavigationProp
  >()

  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 6) {
      navigation.navigate('AccountConfirmPinScreen', {
        ...params,
        pin,
      })
    }
  }, [pin, navigation, params])

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setPin('')
    })

    return unsubscribe
  }, [navigation])

  const handlePress = useCallback((input?: KeypadInput) => {
    if (typeof input === 'number') {
      setPin((val) => (val.length < 6 ? val + input : val))
    } else if (input === 'backspace') {
      setPin((val) => val.slice(0, -1))
    } else {
      setPin('')
    }
  }, [])

  return (
    <Box
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal="8"
      justifyContent="center"
      alignItems="center"
    >
      <Box flex={1} />
      <Text
        color="primaryText"
        marginBottom="4"
        variant="displayMdRegular"
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {t('accountSetup.createPin.title')}
      </Text>

      <Text
        variant="textMdRegular"
        maxFontSizeMultiplier={1.2}
        color="secondaryText"
      >
        {t('accountSetup.createPin.subtitle')}
      </Text>
      <PinDisplay length={pin.length} marginVertical="8" />
      <Keypad flex={2} customButtonType="cancel" onPress={handlePress} />
      <Box flex={1} />
    </Box>
  )
}

const AccountCreatePinScreenWrapper = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <AccountCreatePinScreen />
    </ThemeProvider>
  )
}

export default AccountCreatePinScreenWrapper
