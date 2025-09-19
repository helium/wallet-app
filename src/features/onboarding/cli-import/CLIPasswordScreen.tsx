import Terminal from '@assets/images/terminal.svg'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import BackButton from '@components/BackButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import useAlert from '@hooks/useAlert'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { createKeypair } from '@storage/secureStorage'
import { decryptPasswordProtectedData } from '@utils/crypto'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextStyle } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
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
    return { color: 'white', fontSize: 24, textAlign: 'center' } as TextStyle
  }, [])

  const handleNext = useCallback(async () => {
    try {
      // One simple function call instead of manual crypto operations!
      const decryptedData = decryptPasswordProtectedData(
        { ciphertext, nonce, salt },
        password,
      )

      const { keypair, words } = await createKeypair({
        givenMnemonic: decryptedData.split(' '),
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
    <SafeAreaBox marginHorizontal="l" flex={1} edges={edges}>
      <Box width="100%" alignItems="flex-start" paddingVertical="l">
        <BackButton onPress={onClose} />
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
