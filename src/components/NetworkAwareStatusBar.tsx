import React from 'react'
import { StatusBar } from 'react-native'
import { useColorScheme } from '@theme/themeHooks'

const NetworkAwareStatusBar = () => {
  const theme = useColorScheme()

  return (
    <StatusBar
      animated
      barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
    />
  )
}

export default NetworkAwareStatusBar
