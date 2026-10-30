import { getJazzSeed } from '@utils/accountUtils'
import { jazzicon } from '@utils/jazzicon'
import React from 'react'
import { View } from 'react-native'
import { Rect, Svg } from 'react-native-svg'

export type AccountIconProps = { address?: string; size: number }

// The account's jazzicon in a circle. Renders nothing without an address.
export const AccountIcon = ({ address, size }: AccountIconProps) => {
  const seed = address ? getJazzSeed(address) : undefined
  if (!seed) return null
  const icon = jazzicon(seed, size)

  return (
    <View
      className="overflow-hidden rounded-full"
      style={{ width: size, height: size, backgroundColor: icon.background }}
    >
      <Svg width={size} height={size}>
        {icon.shapes.map(({ fill, transform }) => (
          <Rect
            key={transform}
            x={0}
            y={0}
            width={size}
            height={size}
            fill={fill}
            transform={transform}
          />
        ))}
      </Svg>
    </View>
  )
}
