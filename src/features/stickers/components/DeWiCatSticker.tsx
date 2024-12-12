/* eslint-disable max-len */
import React from 'react'
import { Group, Image, useImage } from '@shopify/react-native-skia'
import type { StickerProps } from './Sticker'

const size = { width: 172, height: 141 }

const Sticker = ({ matrix }: StickerProps) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const image = useImage(require('@assets/images/dewicatSticker.png'))
  return (
    <Group matrix={matrix}>
      <Image
        fit="contain"
        image={image}
        width={size.width}
        height={size.height}
        x={0}
        y={0}
      />
    </Group>
  )
}

export const DeWiCatSticker = { Sticker, size }
