import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useAsync } from 'react-async-hook'
import { useOpacity } from '../theme/themeHooks'
import CustomBlurBackdrop from './CustomBlurBackdrop'
import SafeAreaBox from './SafeAreaBox'

type Props = {
  title: string
  open?: boolean
  children: JSX.Element
  onClose?: () => void
}

const BlurActionSheet = ({ title, open, children, onClose }: Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const { backgroundStyle } = useOpacity('black400', 0.4)

  const handleOnClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  useAsync(async () => {
    if (open) {
      await bottomSheetModalRef.current?.present()
    } else {
      await bottomSheetModalRef.current?.dismiss()
    }
  }, [open])

  const snapPoints = useMemo(() => {
    let maxHeight: number | string = '75%'
    if (contentHeight > 0) {
      maxHeight = contentHeight
    }
    return [maxHeight]
  }, [contentHeight])

  const renderBackdrop = useCallback(
    (props) => (
      <CustomBlurBackdrop
        onPress={handleOnClose}
        title={title}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
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
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        onDismiss={handleOnClose}
      >
        <BottomSheetScrollView>
          <SafeAreaBox edges={safeEdges} onLayout={handleContentLayout}>
            {children}
          </SafeAreaBox>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  )
}

export default memo(BlurActionSheet)
