import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'
import Terminal from '@assets/images/terminal.svg'
import { TextStyle } from 'react-native'
import RNSodium from 'react-native-sodium'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import ButtonPressable from '@components/ButtonPressable'
import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import TextInput from '@components/TextInput'
import {
  DEFAULT_DERIVATION_PATH,
  createDefaultKeypair,
} from '@storage/secureStorage'
import useAlert from '@hooks/useAlert'
import {
  CLIAccountNavigationProp,
  CLIAccountStackParamList,
} from './CLIAccountNavigatorTypes'
import { useOnboarding } from '../OnboardingProvider'

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
    return { color: 'white', fontSize: 24, textAlign: 'center' } as TextStyle
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

      const { keypair, words } = await createDefaultKeypair({
        givenMnemonic: Buffer.from(phrase, 'base64').toString().split(' '),
        use24Words: true,
      })

      setOnboardingData((prev) => ({
        ...prev,
        words,
        paths: [
          {
            keypair,
            derivationPath: DEFAULT_DERIVATION_PATH,
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
    <SafeAreaBox marginHorizontal="l" flex={1} edges={edges}>
      <Box width="100%" alignItems="flex-end" paddingVertical="l">
        <CloseButton onPress={onClose} />
      </Box>
      <Box flexGrow={1} alignItems="center">
        <Terminal width={98} height={98} />

        <Text variant="h2" color="white" marginTop="l" textAlign="center">
          {t('accountImport.cli.password.title')}
        </Text>

        <Text
          variant="subtitle1"
          color="grey500"
          marginTop="l"
          textAlign="center"
        >
          {t('accountImport.cli.password.body')}
        </Text>

        <TextInput
          variant="transparent"
          textInputProps={{
            onChangeText: setPassword,
            placeholderTextColor: 'grey500',
            value: password,
            placeholder: 'password',
            autoCorrect: false,
            autoComplete: 'off',
            keyboardAppearance: 'dark',
            style: inputStyle,
            secureTextEntry: true,
          }}
          marginTop="xl"
          width="100%"
        />
      </Box>

      <Box width="100%">
        <ButtonPressable
          borderRadius="round"
          backgroundColor="blueBright500"
          backgroundColorOpacityPressed={0.7}
          onPress={handleNext}
          title={t('accountImport.cli.password.buttonText')}
          marginBottom="m"
        />
      </Box>
    </SafeAreaBox>
  )
}

export default CLIPasswordScreen
