import React, { forwardRef, useMemo } from 'react'
import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet'
import {
  useBackgroundStyle,
  useBorderRadii,
  useColors,
  useSpacing,
} from '@theme/themeHooks'
import { wh } from '@utils/layout'
import { Platform, StyleProp, ViewStyle } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const HeliumBottomSheet = forwardRef<BottomSheet, BottomSheetProps>(
  (props, ref) => {
    const { children, ...rest } = props
    const { top } = useSafeAreaInsets()
    const spacing = useSpacing()
    const colors = useColors()
    const borderRadii = useBorderRadii()
    const bottomSheetStyle = useBackgroundStyle('primaryText')
    const listAnimatedPos = useSharedValue<number>(wh - 100)

    const snapPoints = useMemo(() => {
      if (Platform.OS === 'ios') {
        return [wh - top - spacing[20]]
      }

      return [wh - top - spacing[20] - spacing[2]]
    }, [top, spacing])

    const handleIndicatorStyle = useMemo(() => {
      return {
        width: 90,
        height: 4,
        backgroundColor: colors.secondaryText,
      }
    }, [colors])

    const handleStyle = useMemo(
      () =>
        ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
        } as StyleProp<ViewStyle>),
      [],
    )

    const backgroundStyle = useMemo(
      () =>
        ({
          ...bottomSheetStyle,
          height: '100%',
          borderRadius: borderRadii['4xl'] + borderRadii['4xl'],
          backgroundColor: colors['fg.white'],
        } as StyleProp<ViewStyle>),
      [bottomSheetStyle, borderRadii, colors],
    )

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        backgroundStyle={backgroundStyle}
        animatedPosition={listAnimatedPos}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        enablePanDownToClose
        {...rest}
      >
        {children}
      </BottomSheet>
    )
  },
)

export default HeliumBottomSheet
