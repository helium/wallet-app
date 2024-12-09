import InfoError from '@assets/svgs/infoError.svg'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import RevealWords from '@components/RevealWords'
import Text from '@components/Text'
import {
  DEFAULT_DERIVATION_PATH,
  createKeypair,
} from '@config/storage/secureStorage'
import { useColors } from '@config/theme/themeHooks'
import React, { useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import ForwardButton from '@components/ForwardButton'
import { useOnboarding } from '../OnboardingProvider'
import { useOnboardingSheet } from '../OnboardingSheet'

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const { setOnboardingData } = useOnboarding()
  const { carouselRef } = useOnboardingSheet()
  const { result: defaultKeypair, loading } = useAsync(async () => {
    // wait 0.5 seconds because creating keypair will freeze the UI and we want to show the loading state
    await new Promise((resolve) => setTimeout(resolve, 500))
    return createKeypair({ use24Words: true })
  }, [])

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
    // navigation.navigate('AccountEnterPassphraseScreen', {
    //   secretKey: Buffer.from(defaultKeypair.keypair.secretKey).toString(
    //     'base64',
    //   ),
    //   words: defaultKeypair.words,
    //   derivationPath: DEFAULT_DERIVATION_PATH,
    // })
    carouselRef?.current?.snapToNext()
  }, [defaultKeypair, carouselRef, setOnboardingData])

  const ListHeaderComponent = useMemo(() => {
    return (
      <Box marginTop="6xl">
        <Box justifyContent="center" alignItems="center" marginBottom="8">
          <InfoError color={colors['blue.dark-500']} />
        </Box>
        <Text
          variant="displayMdSemibold"
          textAlign="center"
          fontSize={40}
          lineHeight={40}
          color="primaryText"
        >
          {t('accountSetup.passphrase.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
          marginTop="4"
          marginHorizontal="6"
        >
          {t('accountSetup.passphrase.subtitle1')}
        </Text>
        <Text
          variant="textXlMedium"
          color="blue.dark-500"
          textAlign="center"
          marginVertical="6"
          marginHorizontal="8"
        >
          {t('accountSetup.passphrase.subtitle2')}
        </Text>
      </Box>
    )
  }, [t, colors])

  if (loading) {
    return (
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        gap="xl"
        padding="2xl"
      >
        <CircleLoader type="blue" loaderSize={60} />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('accountSetup.passphrase.generatingWallet')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('accountSetup.passphrase.thisWontTakeLong')}
        </Text>
      </Box>
    )
  }

  return (
    <Box flex={1}>
      <RevealWords
        ListHeaderComponent={ListHeaderComponent}
        mnemonic={defaultKeypair?.words || []}
      />
      <ForwardButton onPress={navNext} />
    </Box>
  )
}

export default AccountCreatePassphraseScreen
