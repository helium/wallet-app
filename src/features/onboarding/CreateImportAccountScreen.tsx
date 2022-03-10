import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/downArrow.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { OnboardingParentNavigationProp } from './onboardingParentTypes'
import { useOnboarding } from './OnboardingProvider'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useColors } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import BackgroundFill from '../../components/BackgroundFill'
import NetTypeSegment from './NetTypeSegment'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingParentNavigationProp>()
  const { setOnboardingData } = useOnboarding()
  const colors = useColors()

  const createAccount = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      onboardingType: 'create',
    }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, setOnboardingData])

  const importAccount = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      onboardingType: 'import',
    }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, setOnboardingData])

  return (
    <SafeAreaBox flex={1} paddingHorizontal="l" marginBottom="l">
      <Box flex={1} justifyContent="flex-end">
        <NetTypeSegment marginBottom="l" />
        <Text variant="h0" marginTop={{ phone: 'xxxl', smallPhone: 'xl' }}>
          {t('accountSetup.createImport.title')}
        </Text>
      </Box>
      <Box flex={1}>
        <Box marginVertical="l" borderRadius="xl" overflow="hidden">
          <BackgroundFill backgroundColor="surfaceContrast" opacity={0.1} />
          <TouchableOpacityBox onPress={importAccount} padding="lm">
            <Box flexDirection="row" alignItems="center">
              <Text variant="subtitle1" color="blueBright500" flex={1}>
                {t('accountSetup.createImport.import')}
              </Text>
              <DownArrow color={colors.blueBright500} />
            </Box>
            <Text
              variant="body2"
              color="secondaryText"
              numberOfLines={2}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {t('accountSetup.createImport.helperText')}
            </Text>
          </TouchableOpacityBox>
          <Box height={1} backgroundColor="primaryBackground" />
          <TouchableOpacityBox onPress={createAccount} padding="lm">
            <Box flexDirection="row" alignItems="center">
              <Text variant="subtitle1" color="greenBright500" flex={1}>
                {t('accountSetup.createImport.create')}
              </Text>
              <Plus color={colors.greenBright500} />
            </Box>
          </TouchableOpacityBox>
        </Box>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(CreateImportAccountScreen)
