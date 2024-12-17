import { useNavigation } from '@react-navigation/native'
import React, { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import FinePrint from '@components/FinePrint'
import TouchableContainer from '@components/TouchableContainer'
import SecretPhrase from '@assets/svgs/secretPhrase.svg'
import PrivateKey from '@assets/svgs/privateKey.svg'
import CarotRight from '@assets/svgs/carot-right.svg'
import CommandLine from '@assets/svgs/commandLine.svg'
import LedgerCircle from '@assets/svgs/ledgerCircle.svg'
import KeystoneCircle from '@assets/svgs/keystoneCircle.svg'
import BackArrow from '@assets/svgs/backArrow.svg'
import ImageBox from '@components/ImageBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ScrollBox from '@components/ScrollBox'
import { OnboardingNavigationProp } from './onboardingTypes'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
  FlowType,
} from './OnboardingSheet'

const CreateImportAccountScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const colors = useColors()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)
  const spacing = useSpacing()

  const goBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onAddExistingWallet = useCallback(
    (type: FlowType) => () => {
      onboardingSheetRef.current?.show(type)
    },
    [],
  )

  return (
    <ScrollBox
      flex={1}
      contentContainerStyle={{
        justifyContent: 'center',
        padding: spacing['2xl'],
      }}
    >
      <Box
        flexDirection="row"
        justifyContent="center"
        paddingHorizontal="2xl"
        marginTop="4xl"
        marginBottom="6xl"
      >
        <TouchableOpacityBox position="absolute" left={0} onPress={goBack}>
          <BackArrow color={colors['text.quaternary-500']} />
        </TouchableOpacityBox>
        <Text variant="textMdSemibold" color="text.quaternary-500">
          {t('CreateImportAccountScreen.logIn')}
        </Text>
      </Box>
      <Box alignItems="center" gap="xl" marginBottom="4xl">
        <ImageBox source={require('@assets/images/login.png')} />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('CreateImportAccountScreen.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('CreateImportAccountScreen.subtitle')}
        </Text>
      </Box>
      <Box
        backgroundColor="cardBackground"
        borderRadius="2xl"
        flexDirection="column"
        overflow="hidden"
      >
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          backgroundColorPressed="gray.900"
          padding="xl"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('secret-phrase')}
        >
          <SecretPhrase />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.secretPhrase')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.twelveOrTwentyFourWords')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          padding="xl"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          backgroundColorPressed="gray.900"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('private-key')}
        >
          <PrivateKey />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.privateKey')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.aStringOfCharacters')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          backgroundColorPressed="gray.900"
          padding="xl"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('command-line')}
        >
          <CommandLine />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.commandLine')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.scanCli')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          backgroundColorPressed="gray.900"
          padding="xl"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('keystone')}
        >
          <KeystoneCircle />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.connectKeystone')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.scanKeystone')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          backgroundColorPressed="gray.900"
          padding="xl"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('ledger')}
        >
          <LedgerCircle />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.pairLedger')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.tapAButtonToScan')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
      </Box>
      <FinePrint
        marginTop="xl"
        paddingHorizontal="4xl"
        justifyContent="center"
      />
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export default memo(CreateImportAccountScreen)
