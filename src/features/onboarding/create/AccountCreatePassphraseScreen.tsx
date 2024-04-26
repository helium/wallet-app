import Close from '@assets/images/close.svg'
import InfoError from '@assets/images/infoError.svg'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import RevealWords from '@components/RevealWords'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import {
  DEFAULT_DERIVATION_PATH,
  createDefaultKeypair,
} from '@storage/secureStorage'
import { useColors } from '@theme/themeHooks'
import React, { memo, useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingNavigationProp } from '../onboardingTypes'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { hasAccounts } = useAccountStorage()
  const colors = useColors()
  const { setOnboardingData } = useOnboarding()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  const { result: defaultKeypair, loading } = useAsync(
    async () => createDefaultKeypair({ use24Words: true }),
    [],
  )

  const navToTop = useCallback(() => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport')
    }
  }, [hasAccounts, parentNav])

  const navNext = useCallback(() => {
    if (!defaultKeypair) return

    setOnboardingData((prev) => ({
      ...prev,
      words: defaultKeypair?.words,
      paths: [
        {
          derivationPath: DEFAULT_DERIVATION_PATH,
          keypair: defaultKeypair.keypair,
        },
      ],
    }))
    navigation.navigate('AccountEnterPassphraseScreen', {
      secretKey: Buffer.from(defaultKeypair.keypair.secretKey).toString(
        'base64',
      ),
      words: defaultKeypair.words,
      derivationPath: DEFAULT_DERIVATION_PATH,
    })
  }, [defaultKeypair, navigation, setOnboardingData])

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
      {loading ? (
        <Box
          height="100%"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <CircleLoader />
        </Box>
      ) : (
        <RevealWords
          ListHeaderComponent={ListHeaderComponent}
          mnemonic={defaultKeypair?.words || []}
          onDone={navNext}
        />
      )}
    </Box>
  )
}

export default memo(AccountCreatePassphraseScreen)
