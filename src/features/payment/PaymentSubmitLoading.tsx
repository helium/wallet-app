import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const PaymentSubmitLoading = () => {
  const { t } = useTranslation()

  return (
    <>
      <View className="absolute inset-0 justify-center">
        <Spinner size="large" />
      </View>
      <View className="flex-1 justify-end">
        <Text
          size="lg"
          className="p-8 text-center font-medium text-muted-foreground"
        >
          {t('payment.sending')}
        </Text>
      </View>
    </>
  )
}

export default memo(PaymentSubmitLoading)
