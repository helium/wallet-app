import React, { useCallback, memo, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Close from '@assets/images/close.svg'
import InfoError from '@assets/images/infoError.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import RevealWords from '@components/RevealWords'
import { CreateAccountNavigationProp } from './createAccountNavTypes'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingNavigationProp } from '../onboardingTypes'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { createSecureAccount, hasAccounts } = useAccountStorage()
  const colors = useColors()
  const {
    setOnboardingData,
    onboardingData: { netType },
  } = useOnboarding()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const { result: secureAccount } = useAsync(
    async () => createSecureAccount({ netType, use24Words: true }),
    [createSecureAccount, netType],
  )

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

  const navNext = useCallback(() => {
    if (!secureAccount) return

    setOnboardingData((prev) => ({ ...prev, secureAccount }))
    navigation.navigate('AccountEnterPassphraseScreen')
  }, [navigation, secureAccount, setOnboardingData])

  const ListHeaderComponent = useMemo(() => {
    return (
      <>
        <TouchableOpacityBox
          padding="l"
          onPress={navToTop}
          alignItems="flex-end"
        >
          <Close color={colors.primaryText} height={16} width={16} />
        </TouchableOpacityBox>
        <Box justifyContent="center" alignItems="center" marginBottom="xl">
          <InfoError />
        </Box>
        <Text variant="h1" textAlign="center" fontSize={40} lineHeight={40}>
          {t('accountSetup.passphrase.title')}
        </Text>
        <Text
          variant="subtitle1"
          color="secondaryText"
          textAlign="center"
          marginTop="m"
          marginHorizontal="l"
        >
          {t('accountSetup.passphrase.subtitle1')}
        </Text>
        <Text
          variant="subtitle1"
          color="red500"
          textAlign="center"
          marginVertical="l"
          marginHorizontal="xl"
        >
          {t('accountSetup.passphrase.subtitle2')}
        </Text>
      </>
    )
  }, [colors.primaryText, navToTop, t])

  return (
    <Box flex={1} backgroundColor="secondaryBackground">
      <RevealWords
        ListHeaderComponent={ListHeaderComponent}
        mnemonic={secureAccount?.mnemonic || []}
        onDone={navNext}
      />
    </Box>
  )
}

export default memo(AccountCreatePassphraseScreen)
