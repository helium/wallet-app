import BackButton from '@components/BackButton'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { Mnemonic } from '@helium/crypto-react-native'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import React, { memo, useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import RNSodium from 'react-native-sodium'
import { RootNavigationProp } from '../../../navigation/rootTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import {
  DEFAULT_DERIVATION_PATH,
  createKeypair,
} from '../../../storage/secureStorage'
import * as Logger from '../../../utils/logger'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingStackParamList } from '../onboardingTypes'

type Route = RouteProp<OnboardingStackParamList, 'ImportPrivateKey'>

const ImportPrivateKey = () => {
  const { hasAccounts, accounts } = useAccountStorage()
  const navigation = useNavigation<RootNavigationProp>()
  const route = useRoute<Route>()
  const { t } = useTranslation()
  const encodedKey = route.params.key
  const { setOnboardingData, onboardingData } = useOnboarding()
  const [publicKey, setPublicKey] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()

  const createAccount = useCallback(
    async ({ keypair, words }: { keypair: Keypair; words?: string[] }) => {
      const overlap = Object.values(accounts || {}).find(
        (a) => a.solanaAddress === keypair.publicKey.toBase58(),
      )
      if (accounts && overlap) {
        const alias = accounts[overlap.address]?.alias
        setError(t('accountImport.privateKey.exists', { alias }))
        return
      }
      setPublicKey(keypair.publicKey.toBase58())
      setOnboardingData((prev) => {
        return {
          ...prev,
          words,
          paths: [
            {
              keypair,
              derivationPath: DEFAULT_DERIVATION_PATH,
            },
          ],
        }
      })
      setError(undefined)
    },
    [accounts, setOnboardingData, t],
  )

  const decodePrivateKey = useCallback(
    async (key?: string) => {
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
          const { keypair, words } = await createKeypair({
            givenMnemonic: mnemonic.words,
            use24Words: mnemonic.words.length === 24,
            derivationPath: HELIUM_DERIVATION,
          })
          await createAccount({ keypair, words })
        } catch (e) {
          // Must not be b58, try solana keypair
          const keypair = Keypair.fromSecretKey(
            Uint8Array.from(JSON.parse(key)),
          )
          await createAccount({ keypair })
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
          const { keypair } = await createKeypair({
            givenMnemonic: words,
            use24Words: words.length === 24,
          })
          await createAccount({ keypair, words })
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
      navigation.replace('TabBarNavigator')
    } else {
      navigation.replace('OnboardingNavigator')
    }
  }, [hasAccounts, navigation])

  const onImportAccount = useCallback(() => {
    function getRoute(subRoute: string) {
      if (hasAccounts) {
        return [
          'TabBarNavigator',
          {
            screen: 'Home',
            params: {
              screen: subRoute,
            },
          },
        ]
      }

      return [
        'OnboardingNavigator',
        {
          screen: 'ImportAccount',
          params: {
            screen: subRoute,
          },
        },
      ]
    }
    if (onboardingData.words) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace(...getRoute('ImportSubAccounts'))
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.replace(...getRoute('AccountAssignScreen'))
    }
  }, [onboardingData.words, hasAccounts, navigation])

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
    <SafeAreaBox paddingHorizontal="6" flex={1}>
      <BackButton onPress={onBack} paddingHorizontal="0" />
      <Text variant="displayMdRegular" marginTop="4" color="primaryText">
        {t('accountImport.privateKey.title')}
      </Text>
      <Text
        color="secondaryText"
        variant="textMdRegular"
        marginTop="8"
        marginBottom="8"
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
        variant="textMdRegular"
        marginTop="8"
        marginBottom="8"
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
        textColor="primaryText"
        variant="underline"
      />
      <Text
        variant="textMdRegular"
        marginTop="4"
        marginBottom="4"
        visible={!!error}
        color="ros.500"
      >
        {error}
      </Text>
      <Text variant="textMdRegular" marginTop="8" visible={!!publicKey}>
        {t('accountImport.privateKey.body')}
      </Text>
      <Text
        variant="textMdRegular"
        fontWeight="bold"
        marginTop="8"
        textAlign="center"
        visible={!!publicKey}
      >
        {publicKey}
      </Text>
      <Box flex={1} />
      <ButtonPressable
        onPress={onImportAccount}
        title={t('accountImport.privateKey.action')}
        borderRadius="full"
        backgroundColor="primaryText"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="bg.tertiary"
        backgroundColorDisabledOpacity={0.5}
        titleColor="primaryBackground"
        disabled={!!error || publicKey === undefined}
      />
    </SafeAreaBox>
  )
}

export default memo(ImportPrivateKey)
