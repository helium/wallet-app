import CloseCircle from '@assets/images/closeCircleFilled.svg'
import Info from '@assets/images/info.svg'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useAppStorage } from '@storage/AppStorageProvider'
import { Theme } from '@theme/theme'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { appSlice } from '../store/slices/appSlice'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import Config from 'react-native-config'

const MIN_HEIGHT = 52

type BannerProps = {
  onLayout?: (event: LayoutChangeEvent) => void
} & BoxProps<Theme>

const MIN_BALANCE = 0.01 * LAMPORTS_PER_SOL

const Banner = ({ onLayout, ...rest }: BannerProps) => {
  const dispatch = useDispatch()
  const { top } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { autoGasManagementToken } = useAppStorage()
  const { symbol } = useMetaplexMetadata(autoGasManagementToken)
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const { amount: solBalance } = useSolOwnedAmount()
  const needsSwap = useMemo(
    () => solBalance && solBalance <= MIN_BALANCE,
    [solBalance],
  )
  const { loading } = useAsync(async () => {}, [solBalance])
  const swapping = useMemo(() => needsSwap && loading, [needsSwap, loading])
  const baseUrl = useMemo(() => {
    let url = Config.TOKENS_TO_RENT_SERVICE_DEVNET_URL
    if (cluster === 'mainnet-beta') {
      url = Config.TOKENS_TO_RENT_SERVICE_URL
    }

    return url
  }, [cluster])

  const bannerTopMargin = useMemo(() => {
    return top === 0 && initialWindowMetrics?.insets
      ? initialWindowMetrics?.insets.top
      : top
  }, [top])

  const bannerAnimatedStyles = useAnimatedStyle(() => {
    // Animate margin
    return {
      marginTop: withTiming(0),
      paddingTop: bannerTopMargin,
    }
  }, [bannerTopMargin])

  const handleBannerClose = useCallback(() => {
    dispatch(appSlice.actions.setShowBanner(false))
  }, [dispatch])

  return (
    <ReAnimatedBox
      visible={swapping}
      backgroundColor="black650"
      style={bannerAnimatedStyles}
      onLayout={onLayout}
      {...rest}
    >
      <Box
        minHeight={MIN_HEIGHT}
        padding="s"
        paddingHorizontal="m"
        flexDirection="row"
        alignItems="center"
      >
        <Box>
          <Info width={24} height={24} />
        </Box>
        <Text
          variant="body2"
          marginStart="s"
          flex={1}
          adjustsFontSizeToFit
          textAlign="center"
        >
          {t('generic.swappingSol', {
            symbol,
            amount,
          })}
        </Text>
        <TouchableOpacityBox onPress={handleBannerClose}>
          <CloseCircle width={24} height={24} />
        </TouchableOpacityBox>
      </Box>
    </ReAnimatedBox>
  )
}

export default Banner
