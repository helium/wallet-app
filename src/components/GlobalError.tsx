import CopyAddress from '@assets/images/copyAddress.svg'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Box from './Box'
import ButtonPressable from './ButtonPressable'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'
import ScrollBox from './ScrollBox'

export const GlobalError = ({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) => {
  const { t } = useTranslation()
  const copyText = useCopyText()
  const { triggerImpact } = useHaptic()
  const text = `${error.message}\n${error.stack}`
  const handleCopyError = useCallback(() => {
    triggerImpact('light')
    copyText({
      message: t('generic.toClipboard'),
      copyText: text,
    })
  }, [copyText, triggerImpact, text, t])
  return (
    <SafeAreaBox backgroundColor="secondaryBackground" flex={1}>
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text variant="displayMdMedium" color="primaryText">
          {t('crash.title')}
        </Text>
        <Text
          variant="textMdRegular"
          color="primaryText"
          marginBottom="6"
          marginTop="2"
        >
          {t('crash.subTitle')}
        </Text>
        <ScrollBox contentContainerStyle={{ flexGrow: 1 }}>
          <Text variant="textXsBold" color="error.500">
            {error.message}
          </Text>
          <Text variant="textXsRegular" color="error.500">
            {error.stack}
          </Text>
        </ScrollBox>
        <ButtonPressable
          innerContainerProps={{
            justifyContent: 'center',
          }}
          width="100%"
          onPress={handleCopyError}
          backgroundColorOpacityPressed={0.7}
          marginTop="4"
          marginBottom="2"
          borderColor="base.white"
          borderWidth={1}
          borderRadius="full"
          Icon={CopyAddress}
          title={t('generic.copyToClipboard')}
        />
        <ButtonPressable
          width="100%"
          title={t('crash.resetApp')}
          onPress={resetErrorBoundary}
          borderRadius="full"
          backgroundColor="base.white"
          backgroundColorOpacityPressed={0.7}
          titleColorDisabled="secondaryText"
          titleColor="base.black"
        />
      </Box>
    </SafeAreaBox>
  )
}
