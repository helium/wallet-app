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
    <Box onLayout={onLayout} marginHorizontal="l">
      <Box alignSelf="center" marginVertical="l">
        <InfoError />
      </Box>
      <Text variant="h1" color="primaryText" textAlign="center">
        {t('ledger.connectError.title')}
      </Text>
      <Text variant="subtitle1" color="grey300" textAlign="center">
        {t('ledger.connectError.subtitle')}
      </Text>
      {steps.map((step) => (
        <Box
          flexDirection="row"
          key={step}
          marginVertical="m"
          marginHorizontal="l"
          alignItems="center"
        >
          <Check color={primaryText} height={24} width={24} />
          <Text variant="subtitle1" marginLeft="ms">
            {step}
          </Text>
        </Box>
      ))}
      <TouchableOpacityBox
        marginTop="s"
        marginBottom="l"
        onPress={onRetry}
        backgroundColor="surface"
        padding="l"
        borderRadius="round"
      >
        <Text variant="subtitle1" textAlign="center">
          {t('generic.tryAgain')}
        </Text>
      </TouchableOpacityBox>
    </Box>
  )
}

export default memo(LedgerConnectSteps)
