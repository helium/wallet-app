import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Plus from '@assets/images/plus.svg'
import DownArrow from '@assets/images/downArrow.svg'
import Ledger from '@assets/images/ledger.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { OnboardingNavigationProp } from './onboardingTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useColors } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import BackgroundFill from '../../components/BackgroundFill'
import NetTypeSegment from './NetTypeSegment'
import FinePrint from '../../components/FinePrint'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const colors = useColors()

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

        <Box height={1} backgroundColor="primaryBackground" />
      </Box>
      <TouchableOpacityBox
        onPress={connectLedger}
        padding="lm"
        borderRadius="xl"
        overflow="hidden"
      >
        <BackgroundFill backgroundColor="surfaceContrast" opacity={0.06} />
        <Box flexDirection="row" alignItems="center">
          <Text variant="subtitle1" flex={1}>
            {t('accountSetup.createImport.ledger')}
          </Text>
          <Ledger height={20} color={colors.primaryText} />
        </Box>
      </TouchableOpacityBox>
      <FinePrint paddingVertical="l" paddingHorizontal="s" />
    </SafeAreaBox>
  )
}

export default memo(CreateImportAccountScreen)
