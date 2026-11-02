import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CloseButton } from '@ui/CloseButton'
import { TabBar } from '@ui/TabBar'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { Text } from '@ui/Text'
import ConnectKeystoneStart from '../../keystone/ConnectKeystoneStartScreen'
import PairStart from '../../ledger/PairStart'
import AccountCreateStart from '../../onboarding/create/AccountCreateStart'
import AccountImportStartScreen from '../../onboarding/import/AccountImportStartScreen'
import { OnboardingOpt } from '../../onboarding/onboardingTypes'
import { AddNewAccountNavigationProp } from './addNewAccountTypes'

const AddNewAccountScreen = () => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<AddNewAccountNavigationProp>()

  const tabData: Array<{ value: OnboardingOpt; title: string }> = [
    { value: 'create', title: t('onboarding.create') },
    { value: 'import', title: t('onboarding.import') },
    { value: 'ledger', title: t('onboarding.ledger') },
    { value: 'keystone', title: t('onboarding.keystone') },
  ]

  const [selectedOption, setSelectedOption] = useState(tabData[0].value)

  const contentContainerStyle = { flex: 1, paddingBottom: insets.bottom }

  const handleItemSelected = (value: string) => {
    setSelectedOption(value as OnboardingOpt)
  }

  const handleCreate = () => {
    navigation.navigate('CreateAccount')
  }

  return (
    <View
      className="flex-1 bg-secondary"
      style={{ paddingTop: Platform.OS === 'ios' ? insets.top : undefined }}
    >
      <View className="bg-secondary">
        <View className="flex-row items-center py-4">
          <View className="flex-1" />
          <Text size="xl" className="font-medium">
            {t('addNewAccount.title')}
          </Text>
          <View className="flex-1 items-end pe-2">
            <CloseButton
              testID="AddNewAccount.Close"
              accessibilityLabel={t('generic.close')}
              onPress={navigation.goBack}
            />
          </View>
        </View>
        <TabBar
          tabBarOptions={tabData}
          selectedValue={selectedOption}
          onItemSelected={handleItemSelected}
        />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={contentContainerStyle}
      >
        <View className="flex-1">
          {selectedOption === 'create' && (
            <Animated.View
              className="flex-1"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <AccountCreateStart onCreate={handleCreate} inline />
            </Animated.View>
          )}
          {selectedOption === 'import' && (
            <Animated.View
              className="flex-1"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <AccountImportStartScreen inline />
            </Animated.View>
          )}
          {selectedOption === 'ledger' && (
            <Animated.View
              className="flex-1"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <PairStart />
            </Animated.View>
          )}
          {selectedOption === 'keystone' && (
            <Animated.View
              className="flex-1"
              entering={FADE_IN}
              exiting={FADE_OUT}
            >
              <ConnectKeystoneStart />
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default AddNewAccountScreen
