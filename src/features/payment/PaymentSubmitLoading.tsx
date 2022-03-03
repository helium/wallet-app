import React, { memo } from 'react'
import { StyleSheet } from 'react-native'
import Video from 'react-native-video'
import videoSource from '@assets/videos/paymentSent.mp4'
import { useTranslation } from 'react-i18next'
import Text from '../../components/Text'
import Box from '../../components/Box'

type Props = {
  onVideoEnd: () => void
}

const PaymentSubmitLoading = ({ onVideoEnd }: Props) => {
  const { t } = useTranslation()
  return (
    <>
      <Box style={StyleSheet.absoluteFill} justifyContent="center">
        <Box aspectRatio={1}>
          <Video
            resizeMode="contain"
            source={videoSource}
            style={StyleSheet.absoluteFill}
            onEnd={onVideoEnd}
          />
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
