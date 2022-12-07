import React, { useCallback, useEffect, useState } from 'react'
import { BackHandler, Platform } from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'

const useBackHandler = (
  bottomSheetModalRef: React.RefObject<BottomSheetModal>,
) => {
  const [isShowing, setIsShowing] = useState(false)

  const handleDismiss = useCallback(() => setIsShowing(false), [])

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isShowing) {
          bottomSheetModalRef.current?.dismiss()
          return true
        }
        return false
      },
    )
    return () => backHandler.remove()
  }, [bottomSheetModalRef, isShowing])

  return { handleDismiss, setIsShowing }
}

export default useBackHandler
