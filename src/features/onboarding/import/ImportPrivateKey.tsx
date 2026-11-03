import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { Mnemonic } from '@helium/crypto-react-native'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import useSecureWindow from '@hooks/useSecureWindow'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypair } from '@solana/web3.js'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { decryptPasswordProtectedData, extractEd25519Seed } from '@utils/crypto'
import * as Logger from '@utils/logger'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import { ChevronLeft } from 'lucide-react-native'
import React, { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { RootNavigationProp } from '../../../navigation/rootTypes'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import {
  DEFAULT_DERIVATION_PATH,
  createKeypair,
} from '../../../storage/secureStorage'
import { useOnboarding } from '../OnboardingProvider'
import { OnboardingStackParamList } from '../onboardingTypes'

const SafeArea = withUniwind(SafeAreaView)
const BackIcon = withUniwind(ChevronLeft)

type Route = RouteProp<OnboardingStackParamList, 'ImportPrivateKey'>

const ImportPrivateKey = () => {
  useSecureWindow()
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
          const seed = extractEd25519Seed(keyBytes)

          const mnemonic = Mnemonic.fromEntropy(Buffer.from(seed))
          const { keypair, words } = await createKeypair({
            givenMnemonic: mnemonic.words,
            use24Words: mnemonic.words.length === 24,
            derivationPath: HELIUM_DERIVATION,
          })
          await createAccount({ keypair, words })
        } catch {
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

          const decryptedData = decryptPasswordProtectedData(data, password)
          const words = JSON.parse(decryptedData)

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

  useEffect(() => {
    const run = async () => {
      await decodePrivateKey()
    }
    run().catch((e) => console.error(e))
  }, [decodePrivateKey])

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (hasAccounts) {
      navigation.replace('TabBarNavigator')
    } else {
      navigation.replace('OnboardingNavigator')
    }
  }

  const onImportAccount = () => {
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
  }

  const onChangePassword = (text: string) => {
    setPassword(text)
  }

  const onChangeText = (text: string) => {
    void decodePrivateKey(text)
  }

  return (
    <SafeArea className="flex-1 bg-navy px-6">
      <FocusAwareStatusBar barStyle="light-content" />
      <PressableScale
        onPress={onBack}
        hitSlop={24}
        feedback="opacity"
        className="flex-row items-center gap-1 self-start py-4"
      >
        <BackIcon size={16} colorClassName="accent-navy-foreground" />
        <Text className="text-navy-foreground">{t('generic.back')}</Text>
      </PressableScale>
      <Text size="4xl" className="mt-4 font-medium text-navy-foreground">
        {t('accountImport.privateKey.title')}
      </Text>
      {!publicKey && !encodedKey && (
        <>
          <Text size="base" className="my-8 text-navy-foreground">
            {t('accountImport.privateKey.paste')}
          </Text>
          <Input
            placeholder={t('accountImport.privateKey.inputPlaceholder')}
            autoCapitalize="none"
            keyboardAppearance="dark"
            autoCorrect={false}
            onChangeText={onChangeText}
            autoComplete="off"
            returnKeyType="done"
            placeholderTextColorClassName="accent-navy-foreground/50"
            className="bg-navy-glass text-navy-foreground"
          />
        </>
      )}
      {!!encodedKey && (
        <>
          <Text size="base" className="my-8 text-navy-foreground">
            Enter the password you set for your private key.
          </Text>
          <Input
            placeholder={t('accountImport.privateKey.passwordPlaceholder')}
            autoCapitalize="none"
            keyboardAppearance="dark"
            autoCorrect={false}
            onChangeText={onChangePassword}
            autoComplete="off"
            returnKeyType="done"
            placeholderTextColorClassName="accent-navy-foreground/50"
            className="bg-navy-glass text-navy-foreground"
          />
        </>
      )}
      {!!error && (
        <Text size="base" className="my-4 text-destructive">
          {error}
        </Text>
      )}
      {!!publicKey && (
        <>
          <Text size="base" className="mt-8 text-navy-foreground">
            {t('accountImport.privateKey.body')}
          </Text>
          <Text
            size="base"
            className="mt-8 text-center font-bold text-navy-foreground"
          >
            {publicKey}
          </Text>
        </>
      )}
      <View className="flex-1" />
      <Button
        variant="cta"
        size="dashboard"
        className="w-full"
        onPress={onImportAccount}
        disabled={!!error || publicKey === undefined}
      >
        {t('accountImport.privateKey.action')}
      </Button>
    </SafeArea>
  )
}

export default ImportPrivateKey
