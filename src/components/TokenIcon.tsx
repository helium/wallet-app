import React from 'react'
import { Image } from 'react-native'
import Box from './Box'

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

  return (
    <Box
      backgroundColor="cardBackground"
      height={size}
      width={size}
      borderRadius="full"
    />
  )
}

export default TokenIcon
