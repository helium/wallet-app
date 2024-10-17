import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/importIcon.svg'
import Ledger from '@assets/images/ledger.svg'
import Keystone from '@assets/images/keystoneLogo.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '@components/Box'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import BackgroundFill from '@components/BackgroundFill'
import FinePrint from '@components/FinePrint'
import NetTypeSegment from './NetTypeSegment'
import { OnboardingNavigationProp } from './onboardingTypes'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const colors = useColors()
  const { bottom } = useSafeAreaInsets()

  const createAccount = useCallback(() => {
    navigation.navigate('CreateAccount')
  }, [navigation])

  const importAccount = useCallback(() => {
    navigation.navigate('ImportAccount')
  }, [navigation])

  const connectLedger = useCallback(() => {
    navigation.navigate('LedgerNavigator')
  }, [navigation])

  const connectKeystone = useCallback(() => {
    navigation.navigate('KeystoneNavigator')
  }, [navigation])

  return (
    <SafeAreaBox flex={1} paddingHorizontal="6" justifyContent="center">
      <NetTypeSegment marginBottom="6" marginTop="-12" />
      <Text variant="displayLgRegular" color="primaryText">
        {t('accountSetup.createImport.title')}
      </Text>
      <Box marginVertical="6" borderRadius="4xl" overflow="hidden">
        <BackgroundFill backgroundColor="primaryBackground" opacity={0.06} />
        <TouchableOpacityBox
          onPress={importAccount}
          padding="5"
          backgroundColor="cardBackground"
        >
          <Box flexDirection="row" alignItems="center">
            <Text variant="textXlMedium" color="blue.light-500" flex={1}>
              {t('accountSetup.createImport.import')}
            </Text>
            <DownArrow
              height={20}
              width={20}
              color={colors['blue.light-500']}
            />
          </Box>
        </TouchableOpacityBox>
        <Box height={1} backgroundColor="primaryBackground" />
        <TouchableOpacityBox
          onPress={createAccount}
          padding="5"
          backgroundColor="cardBackground"
        >
          <Box flexDirection="row" alignItems="center">
            <Text variant="textXlMedium" color="green.light-500" flex={1}>
              {t('accountSetup.createImport.create')}
            </Text>
            <Plus height={20} width={20} color={colors['green.light-500']} />
          </Box>
        </TouchableOpacityBox>
        <Box height={1} backgroundColor="primaryBackground" />
        <TouchableOpacityBox
          onPress={connectKeystone}
          padding="5"
          backgroundColor="cardBackground"
        >
          <Box flexDirection="row" alignItems="center">
            <Text color="primaryText" variant="textXlMedium" flex={1}>
              {t('accountSetup.createImport.keystone')}
            </Text>
            <Keystone height={20} width={20} color={colors.primaryText} />
          </Box>
        </TouchableOpacityBox>
        <Box height={1} backgroundColor="primaryBackground" />
        <TouchableOpacityBox
          onPress={connectLedger}
          padding="5"
          backgroundColor="cardBackground"
        >
          <Box flexDirection="row" alignItems="center">
            <Text variant="textXlMedium" flex={1} color="primaryText">
              {t('accountSetup.createImport.ledger')}
            </Text>
            <Ledger height={20} width={20} color={colors.primaryText} />
          </Box>
        </TouchableOpacityBox>
      </Box>
      <FinePrint
        position="absolute"
        justifyContent="center"
        paddingBottom="6"
        paddingHorizontal="12"
        bottom={bottom}
        left={0}
        right={0}
      />
    </SafeAreaBox>
  )
}

export default memo(CreateImportAccountScreen)
