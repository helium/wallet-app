import React, { memo, ReactNode, useMemo } from 'react'
import { Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const IOSKeyboardAwareScrollView = ({
  scrollEnabled,
  children,
}: {
  scrollEnabled: boolean
  children: ReactNode
}) => {
  const contentContainer = useMemo(
    () => ({
      flex: 1,
    }),
    [],
  )

  if (Platform.OS === 'android') return <>{children}</>

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={contentContainer}
      scrollEnabled={scrollEnabled}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

export default memo(IOSKeyboardAwareScrollView)
