import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import {
  useBackgroundStyle,
  useBorderRadii,
  useColors,
  useSpacing,
} from '@theme/themeHooks'
import { wh } from '@utils/layout'
import { ReactNode, Ref, forwardRef, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
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
        snapPoints={[wh - top - spacing[20]]}
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
