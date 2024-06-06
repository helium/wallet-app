import CopyAddress from '@assets/images/copyAddress.svg'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import Box from './Box'
import ButtonPressable from './ButtonPressable'
import SafeAreaBox from './SafeAreaBox'
import Text from './Text'

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
        <Text variant="h1Medium" color="white">
          {t('crash.title')}
        </Text>
        <Text variant="body1" color="white" marginBottom="l" marginTop="s">
          {t('crash.subTitle')}
        </Text>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Text variant="body3Bold" color="red500">
            {error.message}
          </Text>
          <Text variant="body3" color="red500">
            {error.stack}
          </Text>
        </ScrollView>
        <ButtonPressable
          innerContainerProps={{
            justifyContent: 'center',
          }}
          width="100%"
          onPress={handleCopyError}
          backgroundColorOpacityPressed={0.7}
          marginTop="m"
          marginBottom="s"
          borderColor="white"
          borderWidth={1}
          borderRadius="round"
          Icon={CopyAddress}
          title={t('generic.copyToClipboard')}
        />
        <ButtonPressable
          width="100%"
          title={t('crash.resetApp')}
          onPress={resetErrorBoundary}
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          titleColorDisabled="secondaryText"
          titleColor="black"
        />
      </Box>
    </SafeAreaBox>
  )
}
