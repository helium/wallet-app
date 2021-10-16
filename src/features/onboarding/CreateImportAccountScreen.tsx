import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/downArrow.svg'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import Text from '../../components/Text'
import ButtonPressable from '../../components/ButtonPressable'
import { OnboardingParentNavigationProp } from './onboardingParentTypes'
import { useOnboarding } from './OnboardingProvider'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingParentNavigationProp>()
  const { setOnboardingData } = useOnboarding()

  const createAccount = useCallback(() => {
    setOnboardingData((prev) => ({ ...prev, onboardingType: 'create' }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, setOnboardingData])

  const importAccount = useCallback(() => {
    setOnboardingData((prev) => ({ ...prev, onboardingType: 'import' }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, setOnboardingData])

  return (
    <Box
      flex={1}
      justifyContent="center"
      backgroundColor="primaryBackground"
      paddingHorizontal="l"
    >
      <ImageBox
        source={require('@assets/images/backgroundGradient.png')}
        bottom={0}
        left={0}
        right={0}
        position="absolute"
      />
      <Text variant="h1">{t('accountSetup.createImport.title')}</Text>
      <Box marginVertical="l" borderRadius="xl">
        <ButtonPressable
          borderTopLeftRadius="xl"
          borderTopRightRadius="xl"
          backgroundColor="surfaceContrast"
          backgroundColorOpacity={0.06}
          backgroundColorOpacityPressed={0.25}
          onPress={importAccount}
          title={t('accountSetup.createImport.import')}
          titleColor="blueBright500"
          Icon={DownArrow}
        />
        <Box height={1} />
        <ButtonPressable
          borderBottomLeftRadius="xl"
          borderBottomRightRadius="xl"
          backgroundColor="surfaceContrast"
          backgroundColorOpacity={0.06}
          backgroundColorOpacityPressed={0.25}
          onPress={createAccount}
          title={t('accountSetup.createImport.create')}
          titleColor="greenBright500"
          Icon={Plus}
        />
      </Box>
      <Text variant="body2" textAlign="center">
        {t('accountSetup.createImport.helperText')}
      </Text>
    </Box>
  )
}

export default memo(CreateImportAccountScreen)
