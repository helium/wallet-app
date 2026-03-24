import React, { memo, useCallback, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import Video from 'react-native-video'
import videoSource from '@assets/videos/paymentSent.mp4'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import Box from '@components/Box'
import ActivityIndicator from '@components/ActivityIndicator'
import FadeInOut from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'

type Props = {
  onVideoEnd: () => void
}

const VIDEO_TIMEOUT_MS = 5000

const PaymentSubmitLoading = ({ onVideoEnd }: Props) => {
  const { t } = useTranslation()
  const [videoEnded, setVideoEnded] = useState(false)

  const handleVideoEnded = useCallback(() => {
    setVideoEnded(true)
    onVideoEnd()
  }, [onVideoEnd])

  // Fallback timeout in case video onEnd never fires
  useEffect(() => {
    const timer = setTimeout(handleVideoEnded, VIDEO_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [handleVideoEnded])

  return (
    <>
      <Box style={StyleSheet.absoluteFill} justifyContent="center">
        <Box aspectRatio={1}>
          {!videoEnded && (
            <FadeInOut style={globalStyles.container} slow>
              <Video
                resizeMode="contain"
                source={videoSource}
                style={StyleSheet.absoluteFill}
                onEnd={handleVideoEnded}
              />
            </FadeInOut>
          )}
          {videoEnded && (
            <FadeInOut>
              <ActivityIndicator />
            </FadeInOut>
          )}
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
