import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { usePrivy } from '@privy-io/expo'
import PrivyAppProvider from '../../providers/PrivyProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import EmailLoginStep from '../migration/components/EmailLoginStep'

type Step = 'welcome' | 'choosePath' | 'selfCustody' | 'emailLogin'

const MigrateToWorldModal: FC = () => {
  const { user } = usePrivy()
  const { t } = useTranslation()
  const { hideModal } = useModal()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const { dismissMigrateToWorld } = useAppStorage()
  const homeNav = useNavigation<HomeNavigationProp>()
  const [step, setStep] = useState<Step>('welcome')

  const handleDismiss = useCallback(() => {
    dismissMigrateToWorld(wallet?.toBase58() || '')
    hideModal()
  }, [dismissMigrateToWorld, wallet, hideModal])

  const handleBack = useCallback(() => {
    if (step === 'selfCustody' || step === 'emailLogin') {
      setStep('choosePath')
    } else if (step === 'choosePath') {
      setStep('welcome')
    }
  }, [step])

  const handleEmailSuccess = useCallback(() => {
    // Email linked, navigate to the full migration flow
    dismissMigrateToWorld(wallet?.toBase58() || '')
    hideModal()
    homeNav.navigate(
      'SettingsNavigator' as any,
      {
        screen: 'MigrateToWorld',
      } as any,
    )
  }, [dismissMigrateToWorld, wallet, hideModal, homeNav])

  const handleChooseEmail = useCallback(() => {
    const hasEmail = user?.linked_accounts?.some((a) => a.type === 'email')
    if (hasEmail) {
      handleEmailSuccess()
    } else {
      setStep('emailLogin')
    }
  }, [user, handleEmailSuccess])

  const handleRevealPrivateKey = useCallback(() => {
    hideModal()
    homeNav.navigate(
      'SettingsNavigator' as any,
      {
        screen: 'RevealPrivateKey',
      } as any,
    )
  }, [hideModal, homeNav])

  const renderWelcome = () => (
    <Box flex={1} justifyContent="space-between">
      <Box flex={1} justifyContent="center" paddingHorizontal="l">
        <Text variant="h1" color="primaryText" textAlign="center">
          {t('migrateToWorldModal.welcome.title')}
        </Text>
        <Text
          variant="body1"
          color="secondaryText"
          textAlign="center"
          marginTop="l"
        >
          {t('migrateToWorldModal.welcome.body')}
        </Text>
      </Box>
      <Box paddingHorizontal="l" paddingBottom="m">
        <ButtonPressable
          width="100%"
          height={60}
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          titleColorPressedOpacity={0.3}
          titleColor="black"
          title={t('migrateToWorldModal.welcome.next')}
          onPress={() => setStep('choosePath')}
          marginBottom="m"
        />
        <ButtonPressable
          width="100%"
          height={48}
          borderRadius="round"
          backgroundColor="transparent"
          backgroundColorOpacityPressed={0.05}
          titleColorPressedOpacity={0.3}
          titleColor="secondaryText"
          title={t('migrateToWorldModal.dismiss')}
          onPress={handleDismiss}
        />
        <Text
          variant="body3"
          color="secondaryText"
          opacity={0.5}
          textAlign="center"
          marginTop="s"
        >
          {t('migrateToWorldModal.findInSettings')}
        </Text>
      </Box>
    </Box>
  )

  const renderChoosePath = () => (
    <Box flex={1} justifyContent="space-between">
      <TouchableOpacityBox
        onPress={handleBack}
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Text variant="body2" color="secondaryText">
          ← Back
        </Text>
      </TouchableOpacityBox>
      <Box paddingHorizontal="l" flex={1} justifyContent="center">
        <Text variant="h4" color="primaryText" textAlign="center">
          {t('migrateToWorldModal.choosePath.title')}
        </Text>

        <Box marginTop="xl">
          <ButtonPressable
            width="100%"
            height={60}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            titleColorPressedOpacity={0.3}
            titleColor="black"
            title={t('migrateToWorldModal.choosePath.emailTitle')}
            onPress={handleChooseEmail}
          />
          <Text
            variant="body3"
            color="secondaryText"
            textAlign="center"
            marginTop="s"
          >
            {t('migrateToWorldModal.choosePath.emailBody')}
          </Text>
        </Box>

        <Box marginTop="l">
          <ButtonPressable
            width="100%"
            height={60}
            borderRadius="round"
            backgroundColor="surfaceSecondary"
            backgroundColorOpacityPressed={0.7}
            titleColorPressedOpacity={0.3}
            titleColor="primaryText"
            title={t('migrateToWorldModal.choosePath.selfCustodyTitle')}
            onPress={() => setStep('selfCustody')}
          />
          <Text
            variant="body3"
            color="secondaryText"
            textAlign="center"
            marginTop="s"
          >
            {t('migrateToWorldModal.choosePath.selfCustodyBody')}
          </Text>
        </Box>
      </Box>
      <Box paddingHorizontal="l" paddingBottom="m">
        <ButtonPressable
          width="100%"
          height={48}
          borderRadius="round"
          backgroundColor="transparent"
          backgroundColorOpacityPressed={0.05}
          titleColorPressedOpacity={0.3}
          titleColor="secondaryText"
          title={t('migrateToWorldModal.dismiss')}
          onPress={handleDismiss}
        />
      </Box>
    </Box>
  )

  const renderSelfCustody = () => (
    <Box flex={1}>
      <TouchableOpacityBox
        onPress={handleBack}
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <Text variant="body2" color="secondaryText">
          ← Back
        </Text>
      </TouchableOpacityBox>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Box paddingHorizontal="l">
          <Text variant="h4" color="primaryText">
            {t('migrateToWorldModal.selfCustody.title')}
          </Text>

          <Text variant="body3" color="orange500" marginTop="m" lineHeight={20}>
            ⚠ {t('migrateToWorldModal.selfCustody.warning')}
          </Text>

          <Box marginTop="l">
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorldModal.selfCustody.step1Title')}
            </Text>
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorldModal.selfCustody.step1Body')}
            </Text>
            <Box flexDirection="row" marginTop="s" gap="l">
              <Text
                variant="body2"
                color="blueBright500"
                onPress={() => Linking.openURL('https://phantom.app')}
              >
                phantom.app
              </Text>
              <Text
                variant="body2"
                color="blueBright500"
                onPress={() => Linking.openURL('https://solflare.com')}
              >
                solflare.com
              </Text>
            </Box>
          </Box>

          <Box
            marginTop="xl"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            paddingTop="l"
          >
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorldModal.selfCustody.step2Title')}
            </Text>
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorldModal.selfCustody.step2Body')}
            </Text>
            <Text
              variant="body2"
              color="blueBright500"
              marginTop="s"
              onPress={handleRevealPrivateKey}
            >
              {t('migrateToWorldModal.selfCustody.step2Button')} →
            </Text>
          </Box>

          <Box
            marginTop="xl"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            paddingTop="l"
          >
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorldModal.selfCustody.step3Title')}
            </Text>
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorldModal.selfCustody.step3Body')}
            </Text>
          </Box>

          <Box
            marginTop="xl"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            paddingTop="l"
          >
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorldModal.selfCustody.step4Title')}
            </Text>
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorldModal.selfCustody.step4Body')}
            </Text>
          </Box>
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" paddingBottom="m">
        <ButtonPressable
          width="100%"
          height={48}
          borderRadius="round"
          backgroundColor="transparent"
          backgroundColorOpacityPressed={0.05}
          titleColorPressedOpacity={0.3}
          titleColor="secondaryText"
          title={t('migrateToWorldModal.dismiss')}
          onPress={handleDismiss}
        />
      </Box>
    </Box>
  )

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="primaryBackground"
      zIndex={999}
    >
      <SafeAreaBox edges={edges} flex={1}>
        {step === 'welcome' && renderWelcome()}
        {step === 'choosePath' && renderChoosePath()}
        {step === 'selfCustody' && renderSelfCustody()}
        {step === 'emailLogin' && (
          <EmailLoginStep onBack={handleBack} onSuccess={handleEmailSuccess} />
        )}
      </SafeAreaBox>
    </Box>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'MigrateToWorld') return null
  return (
    <PrivyAppProvider>
      <MigrateToWorldModal />
    </PrivyAppProvider>
  )
})
