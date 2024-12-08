import Box from '@components/Box'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import useAlert from '@hooks/useAlert'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { createKeypair } from '@config/storage/secureStorage'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextStyle } from 'react-native'
import RNSodium from 'react-native-sodium'
import ForwardButton from '@components/ForwardButton'
import { useOnboarding } from '../OnboardingProvider'
import { useOnboardingSheet } from '../OnboardingSheet'

const CLIPasswordScreen = () => {
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const {
    setOnboardingData,
    onboardingData: { encryptedAccount },
  } = useOnboarding()
  const { carouselRef } = useOnboardingSheet()

  const ciphertext = useMemo(
    () => encryptedAccount?.seed?.ciphertext,
    [encryptedAccount],
  )
  const nonce = useMemo(() => encryptedAccount?.seed?.nonce, [encryptedAccount])
  const salt = useMemo(() => encryptedAccount?.seed?.salt, [encryptedAccount])

  const [password, setPassword] = useState('')

  const inputStyle = useMemo(() => {
    return {
      color: 'base.white',
      fontSize: 24,
      textAlign: 'center',
    } as TextStyle
  }, [])

  const handleNext = useCallback(async () => {
    if (!salt || !ciphertext || !nonce) {
      return
    }
    // Derive key using password and salt.
    const key = await RNSodium.crypto_pwhash(
      32,
      Buffer.from(password).toString('base64'),
      salt,
      RNSodium.crypto_pwhash_OPSLIMIT_MODERATE,
      RNSodium.crypto_pwhash_MEMLIMIT_MODERATE,
      RNSodium.crypto_pwhash_ALG_ARGON2ID13,
    )

    try {
      // Decrypt secretbox_open cipherText using derived key, nonce, and key.
      const phrase = await RNSodium.crypto_secretbox_open_easy(
        ciphertext,
        nonce,
        key,
      )

      const { keypair, words } = await createKeypair({
        givenMnemonic: Buffer.from(phrase, 'base64').toString().split(' '),
        use24Words: true,
        derivationPath: HELIUM_DERIVATION,
      })

      setOnboardingData((prev) => ({
        ...prev,
        words,
        paths: [
          {
            keypair,
            derivationPath: HELIUM_DERIVATION,
          },
        ],
      }))
      carouselRef?.current?.snapToNext()
    } catch (error) {
      await showOKAlert({
        title: t('accountImport.cli.alert.title'),
        message: t('accountImport.cli.alert.body'),
      })
    }
  }, [
    ciphertext,
    nonce,
    password,
    salt,
    setOnboardingData,
    showOKAlert,
    t,
    carouselRef,
  ])

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <Box padding="2xl" flex={1}>
        <Box flexGrow={1} alignItems="center" justifyContent="center">
          <Text
            variant="displayMdSemibold"
            color="primaryText"
            marginTop="6"
            textAlign="center"
          >
            {t('accountImport.cli.password.title')}
          </Text>

          <Text
            variant="textXlMedium"
            color="text.quaternary-500"
            marginTop="6"
            textAlign="center"
          >
            {t('accountImport.cli.password.body')}
          </Text>

          <Box
            width="100%"
            backgroundColor="cardBackground"
            borderRadius="2xl"
            padding="xl"
            marginTop="xl"
          >
            <TextInput
              variant="transparentSmall"
              textInputProps={{
                onChangeText: setPassword,
                placeholderTextColor: 'gray.500',
                value: password,
                placeholder: 'password',
                autoCorrect: false,
                autoComplete: 'off',
                keyboardAppearance: 'dark',
                style: inputStyle,
                secureTextEntry: true,
              }}
              width="100%"
            />
          </Box>
        </Box>

        <ForwardButton onPress={handleNext} />
      </Box>
    </KeyboardAvoidingView>
  )
}

export default CLIPasswordScreen
