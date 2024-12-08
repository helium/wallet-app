import React, { useCallback } from 'react'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import ButtonPressable from '@components/ButtonPressable'
import Box from '@components/Box'
import { width } from '@utils/layout'
import { useSpacing } from '@config/theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import { OnboardingNavigationProp } from './onboardingTypes'

const WelcomeToHeliumScreen = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const onCreateNewAccount = useCallback(() => {
    navigation.push('NewAccount')
  }, [navigation])

  const loginIntoExistingAccount = useCallback(() => {
    navigation.push('CreateImport')
  }, [navigation])

  return (
    <Box flex={1} padding="2xl">
      <Box gap="xl" flex={1} justifyContent="center" alignItems="center">
        <ImageBox
          width={width - spacing['2xl'] * 2}
          source={require('@assets/images/welcomeToHelium.png')}
          resizeMode="contain"
        />
        <Text
          variant="displayLgSemibold"
          color="primaryText"
          textAlign="center"
          adjustsFontSizeToFit
        >
          {t('WelcomeToHeliumScreen.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
          adjustsFontSizeToFit
        >
          {t('WelcomeToHeliumScreen.subtitle')}
        </Text>
      </Box>
      <Box flexDirection="column" width="100%" gap="lg" marginBottom="xl">
        <ButtonPressable
          title={t('WelcomeToHeliumScreen.createNewAccount')}
          backgroundColor="primaryText"
          titleColor="primaryBackground"
          onPress={onCreateNewAccount}
        />
        <ButtonPressable
          title={t('WelcomeToHeliumScreen.loginIntoExistingAccount')}
          backgroundColor="gray.800"
          titleColor="primaryText"
          onPress={loginIntoExistingAccount}
        />
      </Box>
    </Box>
  )
}

export default WelcomeToHeliumScreen
