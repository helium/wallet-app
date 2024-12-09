import Box from '@components/Box'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { Mnemonic } from '@helium/crypto-react-native'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { Buffer } from 'buffer'
import React, { useCallback, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import RNSodium from 'react-native-sodium'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import {
  DEFAULT_DERIVATION_PATH,
  createKeypair,
} from '@config/storage/secureStorage'
import CheckButton from '@components/CheckButton'
import LoadingButton from '@components/LoadingButton'
import { KeyboardAvoidingView } from 'react-native'
import PrivateKey from '@assets/svgs/privateKey.svg'
import * as Logger from '../../../utils/logger'
import { useOnboarding } from '../OnboardingProvider'
import { useOnboardingSheet } from '../OnboardingSheet'

const ImportPrivateKey = () => {
  const { accounts } = useAccountStorage()
  const { t } = useTranslation()
  const { setOnboardingData, onboardingData } = useOnboarding()
  const { carouselRef } = useOnboardingSheet()
  const [publicKey, setPublicKey] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [error, setError] = useState<string>()
  // TODO: Get from onboardingData or just delete
  const encodedKey = undefined

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

  const { execute: decodePrivateKey, loading: decodingPrivateKey } =
    useAsyncCallback(async (key?: string) => {
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
    })

  useAsync(async () => {
    await decodePrivateKey()
  }, [decodePrivateKey])

  const onImportAccount = useCallback(() => {
    if (onboardingData.words) {
      carouselRef?.current?.snapToNext()
    } else {
      carouselRef?.current?.snapToItem(3)
    }
  }, [onboardingData.words, carouselRef])

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
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Box
        padding="2xl"
        justifyContent="center"
        alignItems="center"
        flex={1}
        marginBottom="4xl"
      >
        <PrivateKey width={60} height={60} />
        <Text variant="displayMdSemibold" marginTop="4" color="primaryText">
          {t('accountImport.privateKey.title')}
        </Text>
        <Text
          color="text.quaternary-500"
          variant="textXlRegular"
          marginTop="8"
          marginBottom="8"
          visible={!publicKey && !encodedKey}
        >
          {t('accountImport.privateKey.paste')}
        </Text>
        <Box
          visible={!publicKey && !encodedKey}
          padding="xl"
          width="100%"
          backgroundColor="cardBackground"
          borderRadius="2xl"
        >
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
            variant="transparentSmall"
            fontWeight="600"
          />
        </Box>
        <Text
          variant="textMdRegular"
          marginTop="8"
          marginBottom="8"
          visible={!!encodedKey}
          color="secondaryText"
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
          variant="transparentSmall"
        />
        <Text
          variant="textMdRegular"
          marginTop="4"
          marginBottom="4"
          visible={!!error}
          color="error.500"
        >
          {error}
        </Text>
        <Text
          variant="textMdRegular"
          color="primaryText"
          marginTop="8"
          visible={!!publicKey}
        >
          {t('accountImport.privateKey.body')}
        </Text>
        <Text
          variant="textMdRegular"
          color="secondaryText"
          fontWeight="bold"
          marginTop="8"
          textAlign="center"
          visible={!!publicKey}
        >
          {publicKey}
        </Text>
      </Box>
      {!!publicKey && !decodingPrivateKey && (
        <CheckButton onPress={onImportAccount} />
      )}
      {decodingPrivateKey && <LoadingButton />}
    </KeyboardAvoidingView>
  )
}

export default ImportPrivateKey
