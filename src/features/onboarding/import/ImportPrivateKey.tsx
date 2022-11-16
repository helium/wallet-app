import React, { memo, useCallback, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Mnemonic } from '@helium/crypto-react-native'
import bs58 from 'bs58'
import { useAsync } from 'react-async-hook'
import RNSodium from 'react-native-sodium'
import { MAINNET } from '@helium/address/build/NetTypes'
import { useTranslation } from 'react-i18next'
import Text from '../../../components/Text'
import SafeAreaBox from '../../../components/SafeAreaBox'
import BackButton from '../../../components/BackButton'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { RootNavigationProp } from '../../../navigation/rootTypes'
import { OnboardingStackParamList } from '../onboardingTypes'
import { useOnboarding } from '../OnboardingProvider'
import { createSecureAccount } from '../../../storage/secureStorage'
import * as Logger from '../../../utils/logger'
import ButtonPressable from '../../../components/ButtonPressable'
import Box from '../../../components/Box'
import TextInput from '../../../components/TextInput'

type Route = RouteProp<OnboardingStackParamList, 'ImportPrivateKey'>

const ImportPrivateKey = () => {
  const { hasAccounts } = useAccountStorage()
  const navigation = useNavigation<RootNavigationProp>()
  const route = useRoute<Route>()
  const { t } = useTranslation()
  const privateKey = route.params.key
  const { setOnboardingData } = useOnboarding()
  const [publicKey, setPublicKey] = useState<string>()
  const [error, setError] = useState(false)

  const decodePrivateKey = useCallback(
    async (key?: string) => {
      const keyToDecode = key || privateKey
      if (!keyToDecode) return

      try {
        setError(false)
        const keyBytes = bs58.decode(keyToDecode)
        const seedBase64 = await RNSodium.crypto_sign_ed25519_sk_to_seed(
          Buffer.from(keyBytes).toString('base64'),
        )
        const seedBuffer = Buffer.from(seedBase64, 'base64')
        const mnemonic = Mnemonic.fromEntropy(seedBuffer)
        const secureAccount = await createSecureAccount({
          givenMnemonic: mnemonic,
          netType: MAINNET,
          use24Words: true,
        })
        setPublicKey(secureAccount.address)
        setOnboardingData((prev) => {
          return { ...prev, secureAccount }
        })
      } catch (e) {
        setError(true)
        Logger.error(e)
      }
    },
    [privateKey, setOnboardingData],
  )

  useAsync(async () => {
    await decodePrivateKey()
  }, [decodePrivateKey])

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (hasAccounts) {
      navigation.replace('HomeNavigator')
    } else {
      navigation.replace('OnboardingNavigator')
    }
  }, [hasAccounts, navigation])

  const onImportAccount = useCallback(() => {
    if (hasAccounts) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('HomeNavigator', { screen: 'AccountAssignScreen' })
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('OnboardingNavigator', {
        screen: 'CreateAccount',
        params: {
          screen: 'AccountAssignScreen',
        },
      })
    }
  }, [hasAccounts, navigation])

  const onChangeText = useCallback(
    async (text: string) => {
      await decodePrivateKey(text)
    },
    [decodePrivateKey],
  )

  return (
    <SafeAreaBox paddingHorizontal="l" flex={1}>
      <BackButton onPress={onBack} paddingHorizontal="none" />
      <Text variant="h1" marginTop="m">
        {t('accountImport.privateKey.title')}
      </Text>
      <Text
        variant="body1"
        marginTop="xl"
        marginBottom="xl"
        visible={!publicKey}
      >
        {t('accountImport.privateKey.paste')}
      </Text>
      <TextInput
        visible={!publicKey}
        placeholder={t('accountImport.privateKey.inputPlaceholder')}
        variant="underline"
        autoCapitalize="none"
        keyboardAppearance="dark"
        autoCorrect={false}
        onChangeText={onChangeText}
        autoComplete="off"
        returnKeyType="done"
      />
      <Text
        variant="body1"
        marginTop="m"
        marginBottom="m"
        visible={error}
        color="red500"
      >
        {t('accountImport.privateKey.error')}
      </Text>
      <Text variant="body1" marginTop="xl" visible={!!publicKey}>
        {t('accountImport.privateKey.body')}
      </Text>
      <Text
        variant="body1"
        fontWeight="bold"
        marginTop="xl"
        textAlign="center"
        visible={!!publicKey}
      >
        {publicKey}
      </Text>
      <Box flex={1} />
      <ButtonPressable
        onPress={onImportAccount}
        title={t('accountImport.privateKey.action')}
        borderRadius="round"
        backgroundColor="white"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColor="black"
      />
    </SafeAreaBox>
  )
}

export default memo(ImportPrivateKey)
