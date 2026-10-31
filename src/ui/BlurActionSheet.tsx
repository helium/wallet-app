import {
  type BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { Portal } from '@gorhom/portal'
import { useContentColumnMargins } from '@utils/layout'
import React, { useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { Sheet } from './Sheet'
import { Text } from './Text'

const SafeArea = withUniwind(SafeAreaView)

export type BlurActionSheetProps = {
  title: string
  open?: boolean
  children: React.JSX.Element
  onClose?: () => void
}

// An action sheet that `open` presents and dismisses. It grows with its
// content up to 75% of the window, and reports a dismiss through `onClose`.
export const BlurActionSheet = ({
  title,
  open,
  children,
  onClose,
}: BlurActionSheetProps) => {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const { height } = useWindowDimensions()
  // The sheet mounts at the root portal host, outside the content column
  const sheetMargins = useContentColumnMargins()

  useEffect(() => {
    if (open) {
      sheetRef.current?.present()
    } else {
      sheetRef.current?.dismiss()
    }
  }, [open])

  const snapPoints = [
    contentHeight > 0 ? Math.min(height * 0.75, contentHeight) : '75%',
  ]

  return (
    <Portal>
      <BottomSheetModalProvider>
        <Sheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          style={sheetMargins}
          onDismiss={onClose}
        >
          <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
            <SafeArea
              edges={['bottom']}
              onLayout={(e) =>
                setContentHeight(e.nativeEvent.layout.height + 40)
              }
            >
              <Text size="xl" className="mx-6 mb-4 text-center font-medium">
                {title}
              </Text>
              {children}
            </SafeArea>
          </BottomSheetScrollView>
        </Sheet>
      </BottomSheetModalProvider>
    </Portal>
  )
}
