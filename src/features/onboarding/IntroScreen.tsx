import React, { memo, useCallback } from 'react'
import Helium from '@assets/images/helium.svg'
import { NetTypes as NetType } from '@helium/address'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import AccountIcon from '../../components/AccountIcon'
import { createSecureAccount, SecureAccount } from '../../storage/secureStorage'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { OnboardingNavigationProp } from './onboardingTypes'
import useMount from '../../utils/useMount'
import { useOnboarding } from './OnboardingProvider'

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
  const hitSlop = useHitSlop('l')
  const navigation = useNavigation<OnboardingNavigationProp>()

  const handleTap = useCallback(() => {
    navigation.navigate('CreateImport')
  }, [navigation])

  useMount(() => {
    setOnboardingData((prev) => ({ ...prev, netType: NetType.MAINNET }))
  })

  if (!accounts) return null

  return (
    <Box flex={1}>
      <Box flex={1} marginBottom={{ smallPhone: 'xl', phone: 'xxl' }}>
        <Box marginTop="n_lm" marginLeft="n_lm">
          <AccountIcon size={140} address={accounts[0].address} />
        </Box>
        <Box flex={1} />
        <Box flexDirection="row" alignItems="center">
          <Box flex={1} />
          <Helium height={140} width={140} color={primaryText} />
          <Box flex={1} alignItems="flex-end" marginEnd="n_s">
            <AccountIcon size={60} address={accounts[1].address} />
          </Box>
        </Box>
        <Box flex={2} />
        <Box flexDirection="row" alignItems="center">
          <Box flex={1} alignItems="flex-end">
            <AccountIcon size={56} address={accounts[2].address} />
          </Box>
          <Box width={140} />
          <Box flex={1} alignItems="flex-end" marginEnd="n_s" />
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

        <Box flex={1} justifyContent="center">
          <TouchableOpacityBox hitSlop={hitSlop} onPress={handleTap}>
            <Text
              textAlign="center"
              variant="subtitle1"
              color="primaryText"
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              adjustsFontSizeToFit
              marginTop="s"
            >
              {t('intro.tap')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      </Box>
    </Box>
  )
}

export default memo(IntroScreen)
