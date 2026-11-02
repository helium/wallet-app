import React from 'react'
import { Asset } from 'expo-asset'
import {
  Image as ExpoImage,
  type ImageProps as ExpoImageProps,
} from 'expo-image'
import { withUniwind } from 'uniwind'

// RN Image sizes a bundled asset to its intrinsic size; expo-image draws it at
// 0x0 unless it is sized. Keep the RN behaviour so a bare require() still
// shows, and let the given style override it.
const SizedImage = ({ source, style, ...props }: ExpoImageProps) => {
  if (typeof source !== 'number') {
    return <ExpoImage {...props} source={source} style={style} />
  }
  const { width, height } = Asset.fromModule(source)
  return (
    <ExpoImage
      {...props}
      source={source}
      style={[
        { width: width ?? undefined, height: height ?? undefined },
        style,
      ]}
    />
  )
}

// expo-image with Uniwind className support. Use it in place of RN Image.
export const Image = withUniwind(SizedImage)

export type ImageProps = React.ComponentProps<typeof Image>
