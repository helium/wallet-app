import useLayoutHeight from '@hooks/useLayoutHeight'
import useSolanaHealth from '@hooks/useSolanaHealth'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { CircleX, TriangleAlert } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useAppStore } from '../../store/appStore'

const WarningIcon = withUniwind(TriangleAlert)
const CloseIcon = withUniwind(CircleX)

const MIN_HEIGHT = 52

export enum BannerType {
  DevnetTokens = 'devnetTokens',
  SolanaHealth = 'solanaHealth',
}

type Props = {
  onLayout?: (event: LayoutChangeEvent) => void
  type: BannerType
}

// The devnet or Solana health banner above the accounts screen. Closing it
// slides it up out of view.
const WarningBanner = ({ type, onLayout }: Props) => {
  const [bannerHeight, setBannerHeight] = useLayoutHeight()
  const { top } = useSafeAreaInsets()
  const { t } = useTranslation()
  const showBanner = useAppStore((state) => state.showBanner)
  const setShowBanner = useAppStore((state) => state.setShowBanner)
  const { healthMessage } = useSolanaHealth()

  const bannerTopMargin =
    top === 0 && initialWindowMetrics?.insets
      ? initialWindowMetrics.insets.top
      : top

  const bannerAnimatedStyles = useAnimatedStyle(() => {
    const hiddenOffset = -Math.max(bannerHeight, MIN_HEIGHT) - bannerTopMargin
    return {
      transform: [{ translateY: withTiming(showBanner ? 0 : hiddenOffset) }],
    }
  }, [showBanner, bannerTopMargin])

  return (
    <Animated.View
      className="bg-secondary"
      style={[{ paddingTop: bannerTopMargin }, bannerAnimatedStyles]}
      onLayout={onLayout}
    >
      <View
        className="flex-row items-center px-4 py-2"
        style={{ minHeight: MIN_HEIGHT }}
        onLayout={setBannerHeight}
      >
        <WarningIcon size={24} colorClassName="accent-warning-500" />
        <Text
          size="xs"
          className="ml-2 flex-1 text-center"
          adjustsFontSizeToFit
        >
          {type === BannerType.DevnetTokens
            ? t('generic.devnetTokensWarning')
            : healthMessage}
        </Text>
        <PressableScale
          feedback="opacity"
          hitSlop={8}
          onPress={() => setShowBanner(false)}
        >
          <CloseIcon size={24} colorClassName="accent-muted-foreground" />
        </PressableScale>
      </View>
    </Animated.View>
  )
}

export default WarningBanner
