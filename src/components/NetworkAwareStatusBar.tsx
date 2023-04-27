import React from 'react'
import { StatusBar } from 'react-native'
import { useColors, useColorScheme } from '@theme/themeHooks'

const NetworkAwareStatusBar = () => {
  const colors = useColors()
  const theme = useColorScheme()

  return (
    <StatusBar
      animated
      barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={colors.primaryBackground}
    />
  )
}

export default NetworkAwareStatusBar
