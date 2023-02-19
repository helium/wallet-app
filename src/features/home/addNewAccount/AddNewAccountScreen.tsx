import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import TabBar from '@components/TabBar'
import Text from '@components/Text'
import globalStyles from '@theme/globalStyles'
import PairStart from '../../ledger/PairStart'
import AccountCreateStart from '../../onboarding/create/AccountCreateStart'
import AccountImportStartScreen from '../../onboarding/import/AccountImportStartScreen'
import { OnboardingOpt } from '../../onboarding/onboardingTypes'
import { AddNewAccountNavigationProp } from './addNewAccountTypes'

const AddNewAccountScreen = () => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<AddNewAccountNavigationProp>()

  const tabData = useMemo((): Array<{
    value: OnboardingOpt
    title: string
  }> => {
    return [
      { value: 'create', title: t('onboarding.create') },
      { value: 'import', title: t('onboarding.import') },
      { value: 'ledger', title: t('onboarding.ledger') },
    ]
  }, [t])

  const [selectedOption, setSelectedOption] = useState(tabData[0].value)

  const contentContainerStyle = useMemo(
    () => ({ flex: 1, paddingBottom: insets.bottom }),
    [insets.bottom],
  )

  const handleItemSelected = useCallback((value: string) => {
    setSelectedOption(value as OnboardingOpt)
  }, [])

  const handleCreate = useCallback(() => {
    navigation.navigate('CreateAccount')
  }, [navigation])

  return (
    <Box flex={1} backgroundColor="secondaryBackground">
      <Box backgroundColor="surfaceSecondary">
        <Box flexDirection="row" paddingVertical="m">
          <Box flex={1} />
          <Text variant="subtitle1">{t('addNewAccount.title')}</Text>
          <Box flex={1} />
        </Box>
        <TabBar
          tabBarOptions={tabData}
          selectedValue={selectedOption}
          onItemSelected={handleItemSelected}
        />
      </Box>

      <ScrollView contentContainerStyle={contentContainerStyle}>
        <Box flex={1}>
          {selectedOption === 'create' && (
            <FadeInOut style={globalStyles.container}>
              <AccountCreateStart onCreate={handleCreate} inline />
            </FadeInOut>
          )}
          {selectedOption === 'import' && (
            <FadeInOut style={globalStyles.container}>
              <AccountImportStartScreen inline />
            </FadeInOut>
          )}
          {selectedOption === 'ledger' && (
            <FadeInOut style={globalStyles.container}>
              <PairStart />
            </FadeInOut>
          )}
        </Box>
      </ScrollView>
    </Box>
  )
}

export default memo(AddNewAccountScreen)
