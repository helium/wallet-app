import React from 'react'
import { Image, View } from 'react-native'

export type TokenIconProps = { size?: number; img?: string }

// A token's image in a circle, or an empty circle when it has no image.
export const TokenIcon = ({ size = 40, img }: TokenIconProps) => {
  const style = { width: size, height: size }
  if (img) {
    return (
      <Image
        style={style}
        className="rounded-full"
        source={{ uri: img, cache: 'force-cache' }}
      />
    )
  }
  return <View style={style} className="rounded-full bg-secondary" />
}
