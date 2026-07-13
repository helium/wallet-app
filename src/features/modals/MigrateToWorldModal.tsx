import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { HomeNavigationProp } from '../home/homeTypes'
import WorldButton from '../migration/components/WorldButton'

// A thin launcher: one welcome screen with a single "Get Started" that hands
// off to the full migration flow on the settings stack (where the path choice —
// email vs. own wallet — lives). Keeping the modal to one screen avoids the
// duplicate welcome/choice the standalone flow already presents.
const MigrateToWorldModal: FC = () => {
  const { t } = useTranslation()
  const { hideModal } = useModal()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const wallet = useCurrentWallet()
  const { dismissMigrateToWorld } = useAppStorage()
  const homeNav = useNavigation<HomeNavigationProp>()

  const handleDismiss = useCallback(() => {
    dismissMigrateToWorld(wallet?.toBase58() || '')
    hideModal()
  }, [dismissMigrateToWorld, wallet, hideModal])

  const handleGetStarted = useCallback(() => {
    dismissMigrateToWorld(wallet?.toBase58() || '')
    hideModal()
    homeNav.navigate('SettingsNavigator', {
      screen: 'MigrateToWorld',
    })
  }, [dismissMigrateToWorld, wallet, hideModal, homeNav])

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="worldSurface"
      zIndex={999}
    >
      <SafeAreaBox edges={edges} flex={1}>
        <Box flex={1} justifyContent="space-between">
          <Box flex={1} justifyContent="center" paddingHorizontal="l">
            <Text variant="h1" color="worldInk" textAlign="center">
              {t('migrateToWorldModal.welcome.title')}
            </Text>
            <Text
              variant="body1"
              color="worldSecondaryInk"
              textAlign="center"
              marginTop="l"
            >
              {t('migrateToWorldModal.welcome.body')}
            </Text>
          </Box>
          <Box paddingHorizontal="l" paddingBottom="m">
            <WorldButton
              variant="primary"
              title={t('migrateToWorldModal.welcome.next')}
              onPress={handleGetStarted}
              marginBottom="m"
            />
            <WorldButton
              variant="dismiss"
              title={t('migrateToWorldModal.dismiss')}
              onPress={handleDismiss}
            />
            <Text
              variant="body3"
              color="worldSecondaryInk"
              opacity={0.6}
              textAlign="center"
              marginTop="m"
            >
              {t('migrateToWorldModal.findInSettings')}
            </Text>
          </Box>
        </Box>
      </SafeAreaBox>
    </Box>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'MigrateToWorld') return null
  // Privy is provided once at the app root (src/App.tsx) so the embedded-wallet
  // bridge stays warm across the hand-off to the settings MigrateToWorld screen.
  return <MigrateToWorldModal />
})
