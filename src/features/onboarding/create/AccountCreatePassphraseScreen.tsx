import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DEFAULT_DERIVATION_PATH, createKeypair } from '@storage/secureStorage'
import { useQuery } from '@tanstack/react-query'
import { PressableScale } from '@ui/PressableScale'
import { RevealWords } from '@ui/RevealWords'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { CircleAlert, X } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingNavigationProp } from '../onboardingTypes'
import { CreateAccountNavigationProp } from './createAccountNavTypes'

const CloseIcon = withUniwind(X)
const WarningIcon = withUniwind(CircleAlert)

const AccountCreatePassphraseScreen = () => {
  const { t } = useTranslation()
  const { hasAccounts } = useAccountStorage()
  const { setOnboardingData } = useOnboarding()
  const parentNav = useNavigation<OnboardingNavigationProp>()
  const navigation = useNavigation<CreateAccountNavigationProp>()
  // A secret: generated once for the screen's life and dropped on unmount
  const { data: defaultKeypair, isLoading: loading } = useQuery({
    queryKey: ['createAccountKeypair'],
    queryFn: () => createKeypair({ use24Words: true }),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })

  const navToTop = () => {
    if (hasAccounts) {
      parentNav.popToTop()
    } else {
      parentNav.navigate('CreateImport', undefined, { pop: true })
    }
  }

  const navNext = () => {
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
  }

  const ListHeaderComponent = (
    <>
      <PressableScale
        feedback="opacity"
        hitSlop={16}
        className="items-end py-6"
        onPress={navToTop}
      >
        <CloseIcon size={16} colorClassName="accent-navy-foreground" />
      </PressableScale>
      <View className="mb-8 items-center justify-center">
        <WarningIcon size={64} colorClassName="accent-destructive" />
      </View>
      <Text
        size="4xl"
        className="text-center font-medium leading-10 text-navy-foreground"
      >
        {t('accountSetup.passphrase.title')}
      </Text>
      <Text size="lg" className="mx-6 mt-4 text-center text-navy-foreground/50">
        {t('accountSetup.passphrase.subtitle1')}
      </Text>
      <Text size="lg" className="mx-8 my-6 text-center text-destructive">
        {t('accountSetup.passphrase.subtitle2')}
      </Text>
    </>
  )

  return (
    <View className="flex-1 bg-navy">
      <FocusAwareStatusBar barStyle="light-content" />
      {loading ? (
        <View className="h-full items-center justify-center">
          <Spinner colorClassName="accent-navy-foreground" />
        </View>
      ) : (
        <RevealWords
          ListHeaderComponent={ListHeaderComponent}
          mnemonic={defaultKeypair?.words || []}
          onDone={navNext}
        />
      )}
    </View>
  )
}

export default AccountCreatePassphraseScreen
