import React from 'react'
import { Image } from 'react-native'

export const CameraBackgroundImage = () => {
  return (
    <Image
      style={[{ height: '100%', width: '100%' }]}
      resizeMode="cover"
      source={require('./backgroundAlpha.png')}
    />
  )
}
