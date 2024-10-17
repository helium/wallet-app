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
import BackScreen from '@components/BackScreen'
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
    <BackScreen
      padding="0"
      headerBackgroundColor="primaryBackground"
      backgroundColor="primaryBackground"
      edges={[]}
      headerTopMargin="6xl"
    >
      <SafeAreaBox flex={1} edges={edges}>
        <Box flex={1} marginHorizontal="6">
          <Box width="100%" alignItems="flex-end" paddingTop="6">
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
              {t('accountImport.cli.import.title')}
            </Text>

            <TextTransform
              marginTop="6"
              variant="textXlMedium"
              textAlign="center"
              color="secondaryText"
              i18nKey="accountImport.cli.import.body"
            />
          </Box>

          <Box width="100%">
            <ButtonPressable
              marginTop="4"
              borderRadius="full"
              backgroundColor="primaryText"
              titleColor="primaryBackground"
              backgroundColorOpacityPressed={0.7}
              onPress={handleNext}
              title={t('accountImport.cli.import.buttonText')}
              marginBottom="4"
            />
          </Box>
        </Box>
      </SafeAreaBox>
    </BackScreen>
  )
}

export default CLIAccountImportStartScreen
