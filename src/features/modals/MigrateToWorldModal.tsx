import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { usePrivy } from '@privy-io/expo'
import PrivyAppProvider from '../../providers/PrivyProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import ConnectStep from '../migration/components/ConnectStep'
import EmailLoginStep from '../migration/components/EmailLoginStep'
import StepBackHeader from '../migration/components/StepBackHeader'
import WorldButton from '../migration/components/WorldButton'

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
    homeNav.navigate('SettingsNavigator', {
      screen: 'MigrateToWorld',
    })
  }, [dismissMigrateToWorld, wallet, hideModal, homeNav])

  const handleChooseEmail = useCallback(() => {
    const hasEmail = user?.linked_accounts?.some((a) => a.type === 'email')
    if (hasEmail) {
      handleEmailSuccess()
    } else {
      setStep('emailLogin')
    }
  }, [user, handleEmailSuccess])

  const dismissButton = (
    <WorldButton
      variant="dismiss"
      title={t('migrateToWorldModal.dismiss')}
      onPress={handleDismiss}
    />
  )

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
        <WorldButton
          backgroundColor="white"
          titleColorPressedOpacity={0.3}
          titleColor="black"
          title={t('migrateToWorldModal.welcome.next')}
          onPress={() => setStep('choosePath')}
          marginBottom="m"
        />
        {dismissButton}
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
      <StepBackHeader onBack={handleBack} />
      <Box paddingHorizontal="l" flex={1} justifyContent="center">
        <Text variant="h4" color="primaryText" textAlign="center">
          {t('migrateToWorldModal.choosePath.title')}
        </Text>

        <Box marginTop="xl">
          <WorldButton
            backgroundColor="white"
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
          <WorldButton
            backgroundColor="surfaceSecondary"
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
        {dismissButton}
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
        {step === 'selfCustody' && (
          <ConnectStep onBack={handleBack} onDismiss={handleDismiss} />
        )}
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
