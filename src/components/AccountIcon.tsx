import React, { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Rect, Svg } from 'react-native-svg'
import { getJazzSeed } from '../utils/accountUtils'
import { jazzicon } from '../utils/jazzicon'

type Props = { address?: string; size: number }
const AccountIcon = ({ address, size }: Props) => {
  const icon = useMemo(() => {
    if (!address) return null
    const seed = getJazzSeed(address)
    if (!seed) return null
    return jazzicon(seed, size)
  }, [address, size])

  if (!icon) return null

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: icon.background,
          borderRadius: size / 2,
        },
      ]}
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

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
})

export default memo(AccountIcon)
