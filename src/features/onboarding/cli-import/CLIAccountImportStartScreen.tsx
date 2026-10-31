import FocusAwareStatusBar from '@components/FocusAwareStatusBar'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { SquareTerminal, X } from 'lucide-react-native'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { CLIAccountNavigationProp } from './CLIAccountNavigatorTypes'

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)
const TerminalIcon = withUniwind(SquareTerminal)

const BODY_COMPONENTS = {
  codeHighlight: (
    <Text
      size="xl"
      className="bg-navy-glass font-light text-navy-foreground/50"
    />
  ),
}

const CLIAccountImportStartScreen = () => {
  const navigation = useNavigation<CLIAccountNavigationProp>()
  const { t } = useTranslation()

  const handleNext = () => {
    navigation.navigate('CLIQrScanner')
  }

  const onClose = () => {
    navigation.getParent()?.goBack()
  }

  return (
    <SafeArea edges={['bottom']} className="flex-1 bg-navy">
      <FocusAwareStatusBar barStyle="light-content" />
      <View className="mx-6 flex-1">
        <View className="w-full items-end pt-6">
          <PressableScale feedback="opacity" hitSlop={16} onPress={onClose}>
            <CloseIcon size={16} colorClassName="accent-navy-foreground" />
          </PressableScale>
        </View>
        <View className="grow items-center">
          <TerminalIcon size={64} colorClassName="accent-navy-foreground" />

          <Text size="3xl" className="mt-6 text-center text-navy-foreground">
            {t('accountImport.cli.import.title')}
          </Text>

          <Text
            size="xl"
            className="mt-6 text-center font-medium text-navy-foreground/50"
          >
            <Trans
              i18nKey="accountImport.cli.import.body"
              components={BODY_COMPONENTS}
            />
          </Text>
        </View>

        <Button
          variant="cta"
          size="lg"
          className="my-4 w-full"
          onPress={handleNext}
        >
          {t('accountImport.cli.import.buttonText')}
        </Button>
      </View>
    </SafeArea>
  )
}

export default CLIAccountImportStartScreen
