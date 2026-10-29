import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet'
import { SHEET_TIMING } from '@theme/motion'
import React from 'react'
import { View } from 'react-native'

export type SheetProps = Omit<
  BottomSheetModalProps,
  | 'backdropComponent'
  | 'backgroundComponent'
  | 'handleComponent'
  | 'animationConfigs'
> & {
  ref?: React.Ref<BottomSheetModal>
}

// World's phone tray (style guide §9.5): black/50 overlay, 24px top radius,
// 36×4 grab bar in a 16px grab area.
const SheetBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.5}
  />
)

const SheetBackground = ({ style }: BottomSheetBackgroundProps) => (
  <View style={style} className="rounded-t-3xl bg-popover" />
)

const SheetHandle = () => (
  <View className="h-4 items-center justify-center">
    <View className="h-1 w-9 rounded-full bg-foreground/20" />
  </View>
)

// A token-styled gorhom modal sheet. Present and dismiss it through the ref.
export const Sheet = (props: SheetProps) => (
  <BottomSheetModal
    {...props}
    backdropComponent={SheetBackdrop}
    backgroundComponent={SheetBackground}
    handleComponent={SheetHandle}
    animationConfigs={SHEET_TIMING}
  />
)
