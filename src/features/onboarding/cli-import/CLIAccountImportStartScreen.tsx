import React, { useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Edge } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Terminal from '@assets/images/terminal.svg'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import ButtonPressable from '@components/ButtonPressable'
import Box from '@components/Box'
import CloseButton from '@components/CloseButton'
import TextTransform from '@components/TextTransform'
import { CLIAccountNavigationProp } from './CLIAccountNavigatorTypes'

const CLIAccountImportStartScreen = () => {
  const navigation = useNavigation<CLIAccountNavigationProp>()
  const edges = useMemo((): Edge[] => ['bottom'], [])
  const { t } = useTranslation()

  const handleNext = useCallback(() => {
    navigation.navigate('CLIQrScanner')
  }, [navigation])

  const onClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  return (
    <SafeAreaBox flex={1} edges={edges} backgroundColor="secondary">
      <Box flex={1} marginHorizontal="l">
        <Box width="100%" alignItems="flex-end" paddingTop="l">
          <CloseButton onPress={onClose} />
        </Box>
        <Box flexGrow={1} alignItems="center">
          <Terminal width={98} height={98} />

          <Text variant="h2" color="white" marginTop="l" textAlign="center">
            {t('accountImport.cli.import.title')}
          </Text>

          <TextTransform
            marginTop="l"
            variant="subtitle1"
            textAlign="center"
            color="grey500"
            i18nKey="accountImport.cli.import.body"
          />
        </Box>

        <Box width="100%">
          <ButtonPressable
            marginTop="m"
            borderRadius="round"
            backgroundColor="white"
            titleColor="primaryBackground"
            backgroundColorOpacityPressed={0.7}
            onPress={handleNext}
            title={t('accountImport.cli.import.buttonText')}
            marginBottom="m"
          />
        </Box>
      </Box>
    </SafeAreaBox>
  )
}

export default CLIAccountImportStartScreen
