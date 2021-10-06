import React, { memo, useCallback, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from 'react-native'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import TextInput from '../../components/TextInput'
import {
  OnboardingNavigationProp,
  OnboardingStackParamList,
} from './onboardingTypes'
import { AccountView } from '../../storage/AccountStorageProvider'

type Route = RouteProp<OnboardingStackParamList, 'AccountAssignScreen'>
const AccountAssignScreen = () => {
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { params } = useRoute<Route>()
  const [alias, setAlias] = useState('')
  const [color, setColor] = useState('')

  const handlePress = useCallback(
    (viewType: AccountView) => () => {
      navigation.navigate('AccountCreatePinScreen', {
        pinReset: false,
        account: { ...params, color, alias },
        viewType,
      })
    },
    [alias, color, navigation, params],
  )
  return (
    <SafeAreaBox backgroundColor="primaryBackground" flex={1}>
      <TextInput
        onChangeText={setAlias}
        variant="regular"
        value={alias}
        placeholder="Enter Account Alias"
        autoCorrect={false}
        autoCompleteType="off"
        autoCapitalize="none"
        padding="l"
        margin="l"
      />
      <TextInput
        onChangeText={setColor}
        variant="regular"
        value={color}
        autoCorrect={false}
        autoCompleteType="off"
        autoCapitalize="none"
        padding="l"
        margin="l"
        placeholder="Enter Account Color"
      />

      <Box flexDirection="row" justifyContent="space-around">
        <Button
          title="Use Unified View"
          onPress={handlePress('unified')}
          disabled={!alias?.length || !color?.length}
        />
        <Button
          title="Use Split View"
          onPress={handlePress('split')}
          disabled={!alias?.length || !color?.length}
        />
      </Box>
    </SafeAreaBox>
  )
}

export default memo(AccountAssignScreen)
