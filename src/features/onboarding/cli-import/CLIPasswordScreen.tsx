import Terminal from '@assets/images/terminal.svg'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CloseButton from '@components/CloseButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import useAlert from '@hooks/useAlert'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { createKeypair } from '@storage/secureStorage'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextStyle } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import RNSodium from 'react-native-sodium'
import { useOnboarding } from '../OnboardingProvider'
import {
  CLIAccountNavigationProp,
  CLIAccountStackParamList,
} from './CLIAccountNavigatorTypes'

type Route = RouteProp<CLIAccountStackParamList, 'CLIPasswordScreen'>

const CLIPasswordScreen = () => {
  const navigation = useNavigation<CLIAccountNavigationProp>()
  const edges = useMemo((): Edge[] => ['bottom'], [])
  const route = useRoute<Route>()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const { setOnboardingData } = useOnboarding()

  const {
    seed: { ciphertext, nonce, salt },
  } = route.params

  const onClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  const [password, setPassword] = useState('')

  const inputStyle = useMemo(() => {
    return {
      color: 'base.white',
      fontSize: 24,
      textAlign: 'center',
    } as TextStyle
  }, [])

  const handleNext = useCallback(async () => {
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
      navigation.navigate('AccountAssignScreen')
    } catch (error) {
      await showOKAlert({
        title: t('accountImport.cli.alert.title'),
        message: t('accountImport.cli.alert.body'),
      })
    }
  }, [
    ciphertext,
    navigation,
    nonce,
    password,
    salt,
    setOnboardingData,
    showOKAlert,
    t,
  ])

  return (
    <SafeAreaBox marginHorizontal="6" flex={1} edges={edges}>
      <Box width="100%" alignItems="flex-end" paddingVertical="6">
        <CloseButton onPress={onClose} />
      </Box>
      <Box flexGrow={1} alignItems="center">
        <Terminal width={98} height={98} />

        <Text
          variant="displaySmRegular"
          color="primaryText"
          marginTop="6"
          textAlign="center"
        >
          {t('accountImport.cli.password.title')}
        </Text>

        <Text
          variant="textXlMedium"
          color="gray.500"
          marginTop="6"
          textAlign="center"
        >
          {t('accountImport.cli.password.body')}
        </Text>

        <TextInput
          variant="transparent"
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
          marginTop="8"
          width="100%"
        />
      </Box>

      <Box width="100%">
        <ButtonPressable
          borderRadius="full"
          backgroundColor="blue.light-500"
          backgroundColorOpacityPressed={0.7}
          onPress={handleNext}
          title={t('accountImport.cli.password.buttonText')}
          marginBottom="4"
        />
      </Box>
    </SafeAreaBox>
  )
}

export default CLIPasswordScreen
