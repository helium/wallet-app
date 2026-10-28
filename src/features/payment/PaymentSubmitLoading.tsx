import React, { memo } from 'react'
import { StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import Box from '@components/Box'
import ActivityIndicator from '@components/ActivityIndicator'

const PaymentSubmitLoading = () => {
  const { t } = useTranslation()

  return (
    <>
      <Box style={StyleSheet.absoluteFill} justifyContent="center">
        <Box aspectRatio={1}>
          <ActivityIndicator />
        </Box>
      </Box>
      <Box flex={1} justifyContent="flex-end">
        <Text
          variant="subtitle2"
          textAlign="center"
          color="secondaryText"
          padding="xl"
        >
          {t('payment.sending')}
        </Text>
      </Box>
    </>
  )
}

export default memo(PaymentSubmitLoading)
