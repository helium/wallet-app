import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import Box from '@components/Box'
import TextTransform from '@components/TextTransform'
import ForwardButton from '@components/ForwardButton'
import CommandLine from '@assets/svgs/commandLine.svg'
import { useOnboardingSheet } from '../OnboardingSheet'

const CLIAccountImportStartScreen = () => {
  const { t } = useTranslation()
  const { carouselRef } = useOnboardingSheet()

  const handleNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  return (
    <Box flex={1} padding="2xl" justifyContent="center" alignItems="center">
      <Box marginBottom="4xl" justifyContent="center" alignItems="center">
        <CommandLine width={60} height={60} />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          marginTop="6"
          textAlign="center"
        >
          {t('accountImport.cli.import.title')}
        </Text>

        <TextTransform
          marginTop="6"
          variant="textXlRegular"
          textAlign="center"
          color="text.quaternary-500"
          i18nKey="accountImport.cli.import.body"
        />
      </Box>
      <ForwardButton onPress={handleNext} />
    </Box>
  )
}

export default CLIAccountImportStartScreen
