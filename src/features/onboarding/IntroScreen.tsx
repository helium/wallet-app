import React, { memo, useCallback } from 'react'
import Helium from '@assets/images/helium.svg'
import IotIcon from '@assets/images/iotCircle.svg'
import MobileIcon from '@assets/images/mobileCircle.svg'
import { NetTypes as NetType } from '@helium/address'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated from 'react-native-reanimated'
import Box from '../../components/Box'
import { useColors } from '../../theme/themeHooks'
import AccountIcon from '../../components/AccountIcon'
import { createSecureAccount, SecureAccount } from '../../storage/secureStorage'
import Text from '../../components/Text'
import { OnboardingNavigationProp } from './onboardingTypes'
import useMount from '../../hooks/useMount'
import { useOnboarding } from './OnboardingProvider'
import ButtonPressable from '../../components/ButtonPressable'
import globalStyles from '../../theme/globalStyles'
import { FadeInSlow } from '../../components/FadeInOut'

const accountPromises: Promise<SecureAccount[]> = Promise.all([
  createSecureAccount({ netType: NetType.TESTNET }),
  createSecureAccount({ netType: NetType.TESTNET }),
  createSecureAccount({ netType: NetType.TESTNET }),
])
const IntroScreen = () => {
  const { primaryText } = useColors()
  const { setOnboardingData } = useOnboarding()

  const { result: accounts } = useAsync(() => accountPromises, [])
  const { t } = useTranslation()
  const navigation = useNavigation<OnboardingNavigationProp>()
  const { top } = useSafeAreaInsets()

  const handleTap = useCallback(() => {
    navigation.navigate('CreateImport')
  }, [navigation])

  useMount(() => {
    setOnboardingData((prev) => ({ ...prev, netType: NetType.MAINNET }))
  })

  if (!accounts) return null

  return (
    <Animated.View entering={FadeInSlow} style={globalStyles.container}>
      <Box flex={1} marginBottom={{ smallPhone: 'xl', phone: 'xxl' }}>
        <Box
          marginTop="n_m"
          marginLeft="n_xxxl"
          flexDirection="row"
          justifyContent="space-between"
        >
          <AccountIcon size={180} address={accounts[0].address} />
          <Box marginTop="xl" marginEnd="xl" top={top}>
            <IotIcon />
          </Box>
        </Box>
        <Box flex={1} />
        <Box flexDirection="row">
          <Box flex={1} />
          <Helium height={160} width={160} color={primaryText} />
          <Box flex={1} alignItems="flex-end" marginEnd="n_l" marginStart="l">
            <AccountIcon size={90} address={accounts[1].address} />
          </Box>
        </Box>
        <Box flex={2} />
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box marginStart="xl">
            <MobileIcon />
          </Box>
          <Box marginEnd="xxxl">
            <AccountIcon size={56} address={accounts[2].address} />
          </Box>
        </Box>
      </Box>
      <Box flex={1} marginTop={{ smallPhone: 'xl', phone: 'xxl' }}>
        <Text
          textAlign="center"
          variant="h0"
          color="primaryText"
          numberOfLines={2}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
        >
          {t('intro.title')}
        </Text>
        <Text
          textAlign="center"
          variant="subtitle1"
          color="secondaryText"
          numberOfLines={2}
          maxFontSizeMultiplier={1.2}
          adjustsFontSizeToFit
          marginTop="s"
        >
          {t('intro.subtitle')}
        </Text>

        <Box flex={1} justifyContent="center" paddingHorizontal="l">
          <ButtonPressable
            backgroundColor="white"
            titleColor="primaryBackground"
            fontSize={19}
            fontWeight="500"
            backgroundColorOpacityPressed={0.7}
            borderRadius="round"
            onPress={handleTap}
            title={t('intro.tap')}
          />
        </Box>
      </Box>
    </Animated.View>
  )
}

export default memo(IntroScreen)
