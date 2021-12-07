import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/downArrow.svg'
import { NetType } from '@helium/crypto-react-native'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import Text from '../../components/Text'
import ButtonPressable from '../../components/ButtonPressable'
import { OnboardingParentNavigationProp } from './onboardingParentTypes'
import { useOnboarding } from './OnboardingProvider'
import NetTypeSegment from './NetTypeSegment'
import SafeAreaBox from '../../components/SafeAreaBox'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingParentNavigationProp>()
  const { setOnboardingData } = useOnboarding()
  const [netType, setNetType] = useState(NetType.MAINNET)

  const createAccount = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      onboardingType: 'create',
      netType,
    }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, netType, setOnboardingData])

  const importAccount = useCallback(() => {
    setOnboardingData((prev) => ({
      ...prev,
      onboardingType: 'import',
      netType,
    }))
    navigation.navigate('OnboardingNavigator')
  }, [navigation, netType, setOnboardingData])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      marginTop="l"
      paddingHorizontal="l"
    >
      <ImageBox
        source={require('@assets/images/backgroundGradient.png')}
        bottom={0}
        left={0}
        right={0}
        position="absolute"
      />
      <NetTypeSegment netType={netType} onSegmentChange={setNetType} />
      <Text variant="h1" marginTop="xxxl">
        {t('accountSetup.createImport.title')}
      </Text>
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
    </SafeAreaBox>
  )
}

export default memo(CreateImportAccountScreen)
