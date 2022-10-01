import React, { memo, useCallback, useEffect, useState } from 'react'
import { Insets, LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useVerticalHitSlop } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from './TouchableOpacityBox'

const TabBarItem = ({
  title,
  selected,
  onLayout,
  onPress,
  hitSlop,
}: {
  title: string
  selected: boolean
  onPress: () => void
  onLayout: (event: LayoutChangeEvent) => void
  hitSlop: Insets | undefined
}) => {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      onLayout={onLayout}
      marginRight="m"
      hitSlop={hitSlop}
    >
      <Text
        variant="subtitle2"
        color={selected ? 'primaryText' : 'secondaryText'}
        minWidth={75}
        textAlign="center"
      >
        {title}
      </Text>
    </TouchableOpacityBox>
  )
}

type Props = {
  tabBarOptions: Array<{ title: string; value: string }>
  selectedValue: string
  onItemSelected: (value: string) => void
} & TouchableOpacityBoxProps

const TabBar = ({
  tabBarOptions,
  selectedValue,
  onItemSelected,
  ...rest
}: Props) => {
  const hitSlop = useVerticalHitSlop('l')
  const [itemRects, setItemRects] = useState<Record<string, LayoutRectangle>>()

  const offset = useSharedValue(0)

  const handleLayout = useCallback(
    (value: string) => (e: LayoutChangeEvent) => {
      e.persist()

      setItemRects((x) => ({ ...x, [value]: e.nativeEvent.layout }))
    },
    [],
  )

  const handlePress = useCallback(
    (value: string) => () => {
      onItemSelected(value)
    },
    [onItemSelected],
  )

  useEffect(() => {
    const nextOffset = itemRects?.[selectedValue]?.x || 0

    if (offset.value === 0) {
      // Don't animate on first position update
      offset.value = nextOffset
      return
    }

    offset.value = withSpring(nextOffset, { mass: 0.5 })
  }, [itemRects, offset.value, selectedValue])

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    }
  })

  return (
    <Box>
      <Box
        flexDirection="row"
        justifyContent="center"
        paddingVertical="ms"
        {...rest}
      >
        {tabBarOptions.map((o) => (
          <TabBarItem
            key={o.value}
            title={o.title}
            selected={o.value === selectedValue}
            onLayout={handleLayout(o.value)}
            onPress={handlePress(o.value)}
            hitSlop={hitSlop}
          />
        ))}
      </Box>
      <Animated.View style={animatedStyles}>
        <Box
          backgroundColor="primaryText"
          height={3}
          position="absolute"
          bottom={0.5}
          width={itemRects?.[selectedValue]?.width || 0}
        />
      </Animated.View>
      <Box backgroundColor="black200" height={1} width="100%" />
    </Box>
  )
}

export default memo(TabBar)
