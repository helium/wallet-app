import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { Portal } from '@gorhom/portal'
import { useOpacity } from '@theme/themeHooks'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { LayoutChangeEvent, useWindowDimensions } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useContentColumnMargins } from '../utils/layout'
import CustomBlurBackdrop from './CustomBlurBackdrop'
import SafeAreaBox from './SafeAreaBox'

type Props = {
  title: string
  open?: boolean
  children: React.JSX.Element
  onClose?: () => void
}

const BlurActionSheet = ({ title, open, children, onClose }: Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
  const { height } = useWindowDimensions()
  // The sheet mounts at the root portal host, outside the content column
  const sheetMargins = useContentColumnMargins()

  const handleOnClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (open) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [open])

  const snapPoints = useMemo(() => {
    let maxHeight: number | string = '75%'
    if (contentHeight > 0) {
      maxHeight = Math.min(height * 0.75, contentHeight)
    }

    return [maxHeight]
  }, [contentHeight, height])

  const renderBackdrop = useCallback(
    (props) => (
      <CustomBlurBackdrop
        onPress={handleOnClose}
        title={title}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        {...props}
      />
    ),
    [handleOnClose, title],
  )

  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height + 40)
  }, [])

  return (
    <Portal>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          backgroundStyle={backgroundStyle}
          style={sheetMargins}
          onDismiss={handleOnClose}
        >
          <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
            <SafeAreaBox edges={safeEdges} onLayout={handleContentLayout}>
              {children}
            </SafeAreaBox>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </Portal>
  )
}

export default memo(BlurActionSheet)
