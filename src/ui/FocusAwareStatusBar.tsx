import { useIsFocused } from '@react-navigation/native'
import React from 'react'
import { StatusBar, type StatusBarProps } from 'react-native'

// A StatusBar that applies only while its screen has focus.
export const FocusAwareStatusBar = (props: StatusBarProps) => {
  const isFocused = useIsFocused()

  return isFocused ? <StatusBar {...props} /> : null
}
