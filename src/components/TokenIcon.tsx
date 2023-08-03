import React from 'react'
import { Image } from 'react-native'

type Props = {
  size?: number
  img?: string
}

const TokenIcon = ({ size = 40, img }: Props) => {
  if (img) {
    return (
      <Image
        style={{ height: size, width: size, borderRadius: 400 }}
        source={{
          uri: img || '',
          cache: 'force-cache',
        }}
      />
    )
  }

  return null
}

export default TokenIcon
