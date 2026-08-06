import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import React, { FC, memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, Platform } from 'react-native'
import { HomeNavigationProp } from '../home/homeTypes'
import WorldButton from '../migration/components/WorldButton'
import { WORLD_SHEET, WORLD_TRACKING } from '../migration/migrationTheme'

// The Helium World announcement, reframed as a dismissable bottom-sheet card
// instead of a full-screen takeover: the wallet keeps working, migrating is an
// invitation. Swipe-down, backdrop tap, "Maybe later", and "Get started" all
// funnel through the sheet's onClose so the per-wallet dismissal is recorded on
// every path and the card only auto-shows once (it stays reachable from
// Settings → Migrate to Helium World).
const MigrateToWorldCard: FC = () => {
  const { t } = useTranslation()
  const { hideModal } = useModal()
  const wallet = useCurrentWallet()
  const { dismissMigrateToWorld } = useAppStorage()
  const homeNav = useNavigation<HomeNavigationProp>()
  const sheetRef = useRef<BottomSheet>(null)

  // Once a close has been requested the card is on its way out; the back
  // handler must stop consuming presses or it swallows them on whatever screen
  // is underneath (e.g. the flow screen Get Started just pushed) for the
  // duration of the close animation.
  const closing = useRef(false)

  const handleClosed = useCallback(() => {
    closing.current = true
    dismissMigrateToWorld(wallet?.toBase58() || '')
    hideModal()
  }, [dismissMigrateToWorld, wallet, hideModal])

  // Buttons animate the sheet closed rather than unmounting it — hideModal
  // (via onClose) would pop it out mid-frame.
  const handleNotNow = useCallback(() => {
    closing.current = true
    sheetRef.current?.close()
  }, [])

  const handleGetStarted = useCallback(() => {
    closing.current = true
    // Navigate first so the flow screen slides in beneath the closing sheet.
    homeNav.navigate('SettingsNavigator', {
      screen: 'MigrateToWorld',
    })
    sheetRef.current?.close()
  }, [homeNav])

  // Sheets don't handle the Android hardware back button on their own; close
  // the card (recording the dismissal) instead of letting the tap fall through
  // to navigation underneath the backdrop.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (closing.current) return false
      closing.current = true
      sheetRef.current?.close()
      return true
    })
    return () => sub.remove()
  }, [])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  )

  return (
    <BottomSheet
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      backgroundStyle={WORLD_SHEET.cardBackground}
      handleIndicatorStyle={WORLD_SHEET.handle}
      backdropComponent={renderBackdrop}
      onClose={handleClosed}
    >
      <BottomSheetView>
        <SafeAreaBox
          edges={['bottom']}
          paddingHorizontal="l"
          paddingTop="s"
          paddingBottom="m"
        >
          <Text
            variant="body3Medium"
            color="worldPurple"
            textTransform="uppercase"
            letterSpacing={1.5}
          >
            {t('migrateToWorldModal.welcome.eyebrow')}
          </Text>
          <Text
            variant="h3"
            color="worldInk"
            letterSpacing={WORLD_TRACKING.hero}
            marginTop="s"
          >
            {t('migrateToWorldModal.welcome.title')}
          </Text>
          <Text
            variant="body2"
            color="worldSecondaryInk"
            lineHeight={22}
            marginTop="m"
          >
            {t('migrateToWorldModal.welcome.body')}
          </Text>
          <Box
            backgroundColor="worldSurfaceAlt"
            borderWidth={1}
            borderColor="worldBorder"
            borderRadius="l"
            paddingHorizontal="m"
            paddingVertical="ms"
            marginTop="m"
          >
            <Text variant="body3" color="worldSecondaryInk" lineHeight={17}>
              {t('migrateToWorldModal.welcome.keepsWorking')}
            </Text>
          </Box>
          <WorldButton
            variant="primary"
            title={t('migrateToWorldModal.welcome.next')}
            onPress={handleGetStarted}
            marginTop="l"
          />
          <WorldButton
            variant="ghost"
            title={t('migrateToWorldModal.dismiss')}
            onPress={handleNotNow}
            marginTop="s"
          />
          <Text
            variant="body3"
            color="worldInkFaint"
            textAlign="center"
            marginTop="s"
          >
            {t('migrateToWorldModal.findInSettings')}
          </Text>
        </SafeAreaBox>
      </BottomSheetView>
    </BottomSheet>
  )
}

export default memo(() => {
  const { type } = useModal()

  if (type !== 'MigrateToWorld') return null
  // Privy is provided once at the app root (src/App.tsx) so the embedded-wallet
  // bridge stays warm across the hand-off to the settings MigrateToWorld screen.
  return <MigrateToWorldCard />
})
