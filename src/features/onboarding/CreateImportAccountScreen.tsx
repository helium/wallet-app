import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/importIcon.svg'
import Ledger from '@assets/images/ledger.svg'
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

  return (
    <SafeAreaBox flex={1} paddingHorizontal="l" justifyContent="center">
      <NetTypeSegment marginBottom="l" marginTop="n_xxl" />
      <Text variant="h0">{t('accountSetup.createImport.title')}</Text>
      <Box marginVertical="l" borderRadius="xl" overflow="hidden">
        <BackgroundFill backgroundColor="surfaceContrast" opacity={0.06} />
        <TouchableOpacityBox onPress={importAccount} padding="lm">
          <Box flexDirection="row" alignItems="center">
            <Text variant="subtitle1" color="blueBright500" flex={1}>
              {t('accountSetup.createImport.import')}
            </Text>
            <DownArrow height={20} width={20} color={colors.blueBright500} />
          </Box>
        </TouchableOpacityBox>
        <Box height={1} backgroundColor="primaryBackground" />
        <TouchableOpacityBox onPress={createAccount} padding="lm">
          <Box flexDirection="row" alignItems="center">
            <Text variant="subtitle1" color="greenBright500" flex={1}>
              {t('accountSetup.createImport.create')}
            </Text>
            <Plus height={20} width={20} color={colors.greenBright500} />
          </Box>
        </TouchableOpacityBox>
        <Box height={1} backgroundColor="primaryBackground" />
        <TouchableOpacityBox onPress={connectLedger} padding="lm">
          <Box flexDirection="row" alignItems="center">
            <Text variant="subtitle1" flex={1}>
              {t('accountSetup.createImport.ledger')}
            </Text>
            <Ledger height={20} width={20} color={colors.primaryText} />
          </Box>
        </TouchableOpacityBox>
      </Box>
      <FinePrint
        position="absolute"
        justifyContent="center"
        paddingBottom="l"
        paddingHorizontal="xxl"
        bottom={bottom}
        left={0}
        right={0}
      />
    </SafeAreaBox>
  )
}

export default memo(CreateImportAccountScreen)
