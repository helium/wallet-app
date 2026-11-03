import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypad, type KeypadInput } from '@ui/Keypad'
import { PIN_LENGTH, PinDisplay } from '@ui/PinDisplay'
import { Text } from '@ui/Text'
import React, { useEffect, useState } from 'react'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
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
    if (pin.length === PIN_LENGTH) {
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

  const handlePress = (input?: KeypadInput) => {
    if (typeof input === 'number') {
      setPin((val) => (val.length < PIN_LENGTH ? val + input : val))
    } else if (input === 'backspace') {
      setPin((val) => val.slice(0, -1))
    } else {
      setPin('')
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
        {t('accountSetup.createPin.title')}
      </Text>
      <Text size="base" maxFontSizeMultiplier={1.2}>
        {t('accountSetup.createPin.subtitle')}
      </Text>
      <PinDisplay length={pin.length} className="my-8" />
      <Keypad
        className="flex-[2]"
        customButtonType="cancel"
        onPress={handlePress}
      />
      <View className="flex-1" />
      <TabSafeAreaView edges={['bottom']} />
    </View>
  )
}

export default AccountCreatePinScreen
