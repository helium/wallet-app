import { Canvas, rect, useCanvasRef, SkRect } from '@shopify/react-native-skia'
import React from 'react'
import { View } from 'react-native'
import { GestureHandler } from './GestureHandler'
import { useStickerContext } from './StickerContext'

export const deflate = (rct: SkRect, amount: number) =>
  rect(
    rct.x + amount,
    rct.y + amount,
    rct.width - amount * 2,
    rct.height - amount * 2,
  )

const StickersPage = () => {
  const ref = useCanvasRef()
  const { stickers } = useStickerContext()

  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1 }} ref={ref}>
        {stickers.map(({ Sticker, matrix, dragged }, index) => {
          // eslint-disable-next-line react/no-array-index-key
          return <Sticker key={index} matrix={matrix} dragged={dragged} />
        })}
      </Canvas>
      {stickers.map(({ matrix, size, dragged }, index) => {
        // eslint-disable-next-line react/no-array-index-key
        return (
          <GestureHandler
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            matrix={matrix}
            size={size}
            dragged={dragged}
          />
        )
      })}
    </View>
  )
}

export default StickersPage
