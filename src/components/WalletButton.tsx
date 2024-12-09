import React, { useCallback } from 'react'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import RightArrow from '@assets/svgs/rightArrow.svg'
import AccountIcon from '@components/AccountIcon'
import { useColors } from '@config/theme/themeHooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useBottomSheet } from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { HotspotServiceNavigationProp } from 'src/app/services/HotspotService'
import Loading from './LoadingButton'
import { useHotspotOnboarding } from '../features/hotspot-onboarding/OnboardingSheet'
import { HmhOnboardParams } from '../features/hotspot-onboarding/OnboardingV3Client'

const WalletButton = () => {
  const colors = useColors()
  const wallet = useCurrentWallet()
  const { close } = useBottomSheet()
  const { t } = useTranslation()
  const { onboardDevice, onboardDetails, onboardDeviceLoading } =
    useHotspotOnboarding()
  const navigation = useNavigation<HotspotServiceNavigationProp>()

  const addToWallet = useCallback(async () => {
    if (!wallet) {
      return
    }

    const device: HmhOnboardParams = {
      serial: onboardDetails.deviceInfo.serialNumber,
      qrCode: onboardDetails.qrCode,
      deviceType: onboardDetails.deviceInfo.deviceType,
      location: {
        lat: onboardDetails.latitude,
        lng: onboardDetails.longitude,
      },
      settings: {
        // TODO: Do we need a new screen to allow the user to choose?
        publicWifi: true,
        // TODO: Do we need a new screen to allow the user to choose?
        publicWifiThrottling: 1000,
        // TODO: Do we need a new screen to allow the user to choose?
        continuousConnectivity: true,
        // TODO: Do we need a new screen to allow the user to choose?
        continuousConnectivityThrottling: 0,
      },
    }

    const result = await onboardDevice({
      walletAddress: wallet?.toBase58(),
      device,
    })

    if (result) {
      close()
      navigation.navigate('Hotspot', {
        newHotspot: undefined,
      })
    }
  }, [onboardDetails, onboardDevice, wallet, close, navigation])

  return (
    <ReAnimatedBox
      entering={FadeIn}
      exiting={FadeOut}
      flexDirection="row"
      justifyContent="flex-end"
      paddingBottom="4xl"
      paddingHorizontal="2xl"
      position="absolute"
      bottom={0}
      right={0}
    >
      {onboardDeviceLoading ? (
        <Loading />
      ) : (
        <TouchableContainer
          onPress={addToWallet}
          backgroundColor="primaryText"
          backgroundColorPressed="primaryText"
          flexDirection="row"
          borderRadius="full"
          paddingStart="2xl"
          paddingEnd="xl"
          paddingVertical="3"
          alignItems="center"
          pressableStyles={{ flex: undefined }}
        >
          <Text
            variant="textLgSemibold"
            color="primaryBackground"
            marginRight="md"
          >
            {t('OnboardingSheet.addToWallet')}
          </Text>
          <Box marginEnd="xl">
            <RightArrow color={colors.primaryBackground} />
          </Box>
          <AccountIcon size={36} address={wallet?.toBase58()} />
        </TouchableContainer>
      )}
    </ReAnimatedBox>
  )
}

export default WalletButton
