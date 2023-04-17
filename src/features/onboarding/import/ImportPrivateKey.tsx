import React, { memo, useCallback, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Mnemonic } from '@helium/crypto-react-native'
import bs58 from 'bs58'
import { useAsync } from 'react-async-hook'
import RNSodium from 'react-native-sodium'
import { MAINNET } from '@helium/address/build/NetTypes'
import { useTranslation } from 'react-i18next'
import { Buffer } from 'buffer'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import BackButton from '@components/BackButton'
import ButtonPressable from '@components/ButtonPressable'
import Box from '@components/Box'
import TextInput from '@components/TextInput'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { RootNavigationProp } from '../../../navigation/rootTypes'
import { OnboardingStackParamList } from '../onboardingTypes'
import { useOnboarding } from '../OnboardingProvider'
import {
  createSecureAccount,
  SecureAccount,
} from '../../../storage/secureStorage'
import * as Logger from '../../../utils/logger'
import { useAppStorage } from '../../../storage/AppStorageProvider'

type Route = RouteProp<OnboardingStackParamList, 'ImportPrivateKey'>

const ImportPrivateKey = () => {
  const { hasAccounts } = useAccountStorage()
  const navigation = useNavigation<RootNavigationProp>()
  const route = useRoute<Route>()
  const { t } = useTranslation()
  const encodedKey = route.params.key
  const { setOnboardingData } = useOnboarding()
  const [publicKey, setPublicKey] = useState<string>()
  const [secureAccount, setSecureAccount] = useState<SecureAccount>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()
  const { accounts } = useAccountStorage()
  const { l1Network } = useAppStorage()

  const createAccount = useCallback(
    async (mnemonic: Mnemonic) => {
      const account = await createSecureAccount({
        givenMnemonic: mnemonic,
        netType: MAINNET,
      })
      if (
        accounts &&
        Object.keys(accounts).find((a) => a === account.address)
      ) {
        const alias = accounts[account.address]?.alias
        setError(t('accountImport.privateKey.exists', { alias }))
        return
      }
      setSecureAccount(account)
      setPublicKey(account.address)
      setOnboardingData((prev) => {
        return { ...prev, secureAccount: account }
      })
      setError(undefined)
    },
    [accounts, setOnboardingData, t],
  )

  const decodePrivateKey = useCallback(
    async (key?: string) => {
      setSecureAccount(undefined)
      setPublicKey(undefined)

      if (key) {
        // decoding b58 private key
        try {
          const keyBytes = bs58.decode(key)
          const seedBase64 = await RNSodium.crypto_sign_ed25519_sk_to_seed(
            Buffer.from(keyBytes).toString('base64'),
          )
          const seedBuffer = Buffer.from(seedBase64, 'base64')
          const mnemonic = Mnemonic.fromEntropy(seedBuffer)
          await createAccount(mnemonic)
        } catch (e) {
          setError(t('accountImport.privateKey.error'))
          Logger.error(e)
        }
      } else if (encodedKey) {
        // decoding base64 encrypted key
        if (!password) {
          setError(t('accountImport.privateKey.passwordError'))
          return
        }
        try {
          const buffer = Buffer.from(encodedKey, 'base64')
          const data = JSON.parse(buffer.toString()) as {
            ciphertext: string
            nonce: string
            salt: string
          }
          const cryptoKey = await RNSodium.crypto_pwhash(
            32,
            Buffer.from(password).toString('base64'),
            data.salt,
            RNSodium.crypto_pwhash_OPSLIMIT_MODERATE,
            RNSodium.crypto_pwhash_MEMLIMIT_MODERATE,
            RNSodium.crypto_pwhash_ALG_ARGON2ID13,
          )
          const base64Words = await RNSodium.crypto_secretbox_open_easy(
            data.ciphertext,
            data.nonce,
            cryptoKey,
          )
          const words = JSON.parse(
            Buffer.from(base64Words, 'base64').toString(),
          )
          const mnemonic = new Mnemonic(words)
          await createAccount(mnemonic)
        } catch (e) {
          setError(t('accountImport.privateKey.errorPassword'))
          Logger.error(e)
        }
      }
    },
    [createAccount, encodedKey, password, t],
  )

  useAsync(async () => {
    await decodePrivateKey()
  }, [decodePrivateKey])

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (hasAccounts) {
      navigation.replace(
        l1Network === 'helium' ? 'HomeNavigator' : 'TabBarNavigator',
      )
    } else {
      navigation.replace('OnboardingNavigator')
    }
  }, [hasAccounts, navigation, l1Network])

  const onImportAccount = useCallback(() => {
    if (hasAccounts) {
      if (l1Network === 'helium') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        navigation.replace('HomeNavigator', {
          screen: 'AccountAssignScreen',
          params: {
            secureAccount,
          },
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        navigation.replace('TabBarNavigator', {
          screen: 'Home',
          params: {
            screen: 'AccountAssignScreen',
            params: {
              secureAccount,
            },
          },
        })
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace('OnboardingNavigator', {
        screen: 'CreateAccount',
        params: {
          screen: 'AccountAssignScreen',
          params: {
            secureAccount,
          },
        },
      })
    }
  }, [hasAccounts, l1Network, navigation, secureAccount])

  const onChangePassword = useCallback((text: string) => {
    setPassword(text)
  }, [])

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
        visible={!publicKey && !encodedKey}
      >
        {t('accountImport.privateKey.paste')}
      </Text>
      <TextInput
        visible={!publicKey && !encodedKey}
        textInputProps={{
          placeholder: t('accountImport.privateKey.inputPlaceholder'),
          autoCapitalize: 'none',
          keyboardAppearance: 'dark',
          autoCorrect: false,
          onChangeText,
          autoComplete: 'off',
          returnKeyType: 'done',
        }}
        variant="underline"
      />
      <Text
        variant="body1"
        marginTop="xl"
        marginBottom="xl"
        visible={!!encodedKey}
      >
        Enter the password you set for your private key.
      </Text>
      <TextInput
        visible={!!encodedKey}
        textInputProps={{
          placeholder: t('accountImport.privateKey.passwordPlaceholder'),
          autoCapitalize: 'none',
          keyboardAppearance: 'dark',
          autoCorrect: false,
          onChangeText: onChangePassword,
          autoComplete: 'off',
          returnKeyType: 'done',
        }}
        variant="underline"
      />
      <Text
        variant="body1"
        marginTop="m"
        marginBottom="m"
        visible={!!error}
        color="red500"
      >
        {error}
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
        disabled={!!error || secureAccount === undefined}
      />
    </SafeAreaBox>
  )
}

export default memo(ImportPrivateKey)
