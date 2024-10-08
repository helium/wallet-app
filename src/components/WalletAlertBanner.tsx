import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { NATIVE_MINT } from '@solana/spl-token'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { runOnJS, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import useLayoutHeight from '@hooks/useLayoutHeight'
import { Box, ReAnimatedBox, Text } from '.'

const WalletAlertBanner = () => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const { amount } = useOwnedAmount(wallet, NATIVE_MINT)
  const [isExpanded, setIsExpanded] = useState(false)
  const [height, setHeight] = useLayoutHeight()
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if ((amount || 0) < MIN_BALANCE_THRESHOLD) {
      setIsExpanded(true)
    }
  }, [amount])

  const body = useMemo(() => {
    if ((amount || 0) < MIN_BALANCE_THRESHOLD) {
      return t('walletAlertBanner.insufficentSol')
    }
  }, [amount])

  const onAnimationComplete = useCallback((isFinished) => {
    if (isFinished) {
      setAnimationComplete(true)
    }
  }, [])

  const animatedStyles = useAnimatedStyle(() => {
    if (isExpanded) {
      return {
        height: withTiming(
          height > 0 && animationComplete ? height : 80,
          undefined,
          runOnJS(onAnimationComplete),
        ),
        opacity: withTiming(1),
      }
    }

    return {
      height: withTiming(0),
      opacity: withTiming(0),
    }
  }, [isExpanded, height, animationComplete])

  if (!body) return null

  return (
    <ReAnimatedBox style={[animatedStyles]} marginHorizontal="5">
      <Box
        backgroundColor="fg.quinary-400"
        borderRadius="lg"
        padding="4"
        onLayout={isExpanded ? setHeight : undefined}
      >
        <Text variant="textMdMedium" color="primaryBackground">
          {body}
        </Text>
      </Box>
    </ReAnimatedBox>
  )
}

export default WalletAlertBanner
