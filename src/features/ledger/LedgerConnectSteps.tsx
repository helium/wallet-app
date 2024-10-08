import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Check from '@assets/images/checkmark.svg'
import { LayoutChangeEvent } from 'react-native'
import InfoError from '@assets/images/infoError.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'

type Props = {
  onLayout?: (event: LayoutChangeEvent) => void
  onRetry: () => void
}
const LedgerConnectSteps = ({ onLayout, onRetry }: Props) => {
  const { t } = useTranslation()
  const steps: string[] = t('ledger.connectError.steps', {
    returnObjects: true,
  })
  const { primaryText } = useColors()

  return (
    <Box onLayout={onLayout} marginHorizontal="6">
      <Box alignSelf="center" marginVertical="6">
        <InfoError />
      </Box>
      <Text variant="displayMdRegular" color="primaryText" textAlign="center">
        {t('ledger.connectError.title')}
      </Text>
      <Text variant="textXlMedium" color="gray.300" textAlign="center">
        {t('ledger.connectError.subtitle')}
      </Text>
      {steps.map((step) => (
        <Box
          flexDirection="row"
          key={step}
          marginVertical="4"
          marginHorizontal="6"
          alignItems="center"
        >
          <Check color={primaryText} height={24} width={24} />
          <Text variant="textXlMedium" marginLeft="3" color="primaryText">
            {step}
          </Text>
        </Box>
      ))}
      <TouchableOpacityBox
        marginTop="2"
        marginBottom="6"
        onPress={onRetry}
        backgroundColor="primaryText"
        padding="6"
        borderRadius="full"
      >
        <Text
          variant="textXlMedium"
          textAlign="center"
          color="primaryBackground"
        >
          {t('generic.tryAgain')}
        </Text>
      </TouchableOpacityBox>
    </Box>
  )
}

export default memo(LedgerConnectSteps)
