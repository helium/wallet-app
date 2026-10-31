import FocusAwareStatusBar from '@components/FocusAwareStatusBar'
import useAlert from '@hooks/useAlert'
import { HELIUM_DERIVATION } from '@hooks/useDerivationAccounts'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { createKeypair } from '@storage/secureStorage'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { decryptPasswordProtectedData } from '@utils/crypto'
import { SquareTerminal, X } from 'lucide-react-native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useOnboarding } from '../OnboardingProvider'
import {
  CLIAccountNavigationProp,
  CLIAccountStackParamList,
} from './CLIAccountNavigatorTypes'

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)
const TerminalIcon = withUniwind(SquareTerminal)

type Route = RouteProp<CLIAccountStackParamList, 'CLIPasswordScreen'>

const CLIPasswordScreen = () => {
  const navigation = useNavigation<CLIAccountNavigationProp>()
  const route = useRoute<Route>()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const { setOnboardingData } = useOnboarding()

  const {
    seed: { ciphertext, nonce, salt },
  } = route.params

  const onClose = () => {
    navigation.getParent()?.goBack()
  }

  const [password, setPassword] = useState('')

  const handleNext = async () => {
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
    } catch {
      await showOKAlert({
        title: t('accountImport.cli.alert.title'),
        message: t('accountImport.cli.alert.body'),
      })
    }
  }

  return (
    <SafeArea edges={['bottom']} className="flex-1 bg-navy px-6">
      <FocusAwareStatusBar barStyle="light-content" />
      <View className="w-full items-end py-6">
        <PressableScale feedback="opacity" hitSlop={16} onPress={onClose}>
          <CloseIcon size={16} colorClassName="accent-navy-foreground" />
        </PressableScale>
      </View>
      <View className="grow items-center">
        <TerminalIcon size={64} colorClassName="accent-navy-foreground" />

        <Text size="3xl" className="mt-6 text-center text-navy-foreground">
          {t('accountImport.cli.password.title')}
        </Text>

        <Text
          size="xl"
          className="mt-6 text-center font-medium text-navy-foreground/50"
        >
          {t('accountImport.cli.password.body')}
        </Text>

        <Input
          onChangeText={setPassword}
          value={password}
          placeholder="password"
          autoCorrect={false}
          autoComplete="off"
          keyboardAppearance="dark"
          secureTextEntry
          placeholderTextColorClassName="accent-navy-foreground/50"
          className="mt-8 h-12 bg-navy-glass text-center text-2xl text-navy-foreground"
        />
      </View>

      <Button
        variant="cta"
        size="lg"
        className="mb-4 w-full"
        onPress={() => void handleNext().catch(console.error)}
      >
        {t('accountImport.cli.password.buttonText')}
      </Button>
    </SafeArea>
  )
}

export default CLIPasswordScreen
