import React, { memo, ReactNode, useMemo } from 'react'
import { Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

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
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={contentContainer}
      scrollEnabled={scrollEnabled}
      bottomOffset={75}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

export default memo(IOSKeyboardAwareScrollView)
