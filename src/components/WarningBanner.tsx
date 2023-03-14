import useLayoutHeight from '@hooks/useLayoutHeight'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  useSafeAreaInsets,
  initialWindowMetrics,
} from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import InfoWarning from '@assets/images/warning.svg'
import CloseCircle from '@assets/images/closeCircleFilled.svg'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { LayoutChangeEvent } from 'react-native'
import { RootState } from '../store/rootReducer'
import { ReAnimatedBox } from './AnimatedBox'
import Box from './Box'
import Text from './Text'
import { appSlice } from '../store/slices/appSlice'
import TouchableOpacityBox from './TouchableOpacityBox'

const Banner = ({
  onLayout,
  ...rest
}: BoxProps<Theme> & { onLayout?: (event: LayoutChangeEvent) => void }) => {
  const dispatch = useDispatch()
  const [bannerHeight, setBannerHeight] = useLayoutHeight()
  const { top } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { showBanner } = useSelector((state: RootState) => state.app)

  const bannerTopMargin = useMemo(() => {
    return top === 0 && initialWindowMetrics?.insets
      ? initialWindowMetrics?.insets.top
      : top
  }, [top])

  const bannerAnimatedStyles = useAnimatedStyle(() => {
    if (!showBanner) {
      return {
        marginTop: withTiming(-bannerHeight - bannerTopMargin),
        paddingTop: bannerTopMargin,
      }
    }
    // Animate margin
    return {
      marginTop: withTiming(0),
      paddingTop: bannerTopMargin,
    }
  }, [showBanner])

  const handleBannerClose = useCallback(() => {
    dispatch(appSlice.actions.setShowBanner(false))
  }, [dispatch])

  return (
    <ReAnimatedBox
      backgroundColor="black650"
      style={bannerAnimatedStyles}
      onLayout={onLayout}
      {...rest}
    >
      <Box
        padding="s"
        paddingHorizontal="m"
        flexDirection="row"
        alignItems="center"
        onLayout={setBannerHeight}
      >
        <Box>
          <InfoWarning width={24} height={24} />
        </Box>
        <Text variant="body2" marginStart="s" flex={1} adjustsFontSizeToFit>
          {t('generic.devnetTokensWarning')}
        </Text>
        <TouchableOpacityBox onPress={handleBannerClose}>
          <CloseCircle width={24} height={24} />
        </TouchableOpacityBox>
      </Box>
    </ReAnimatedBox>
  )
}

export default Banner
