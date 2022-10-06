import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Insets, LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { SvgProps } from 'react-native-svg'
import { Color } from '../theme/theme'
import { useColors, useVerticalHitSlop } from '../theme/themeHooks'
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
  Icon,
  iconSize,
  iconColor,
  value,
}: {
  selected: boolean
  onPress: () => void
  onLayout: (event: LayoutChangeEvent) => void
  hitSlop: Insets | undefined
} & TabBarOption) => {
  const colors = useColors()

  const iconColorValue = useMemo(() => {
    if (!selected) return colors.secondaryText
    if (!iconColor) return colors.primaryText
    return colors[iconColor]
  }, [colors, iconColor, selected])

  return (
    <TouchableOpacityBox
      key={value}
      onPress={onPress}
      onLayout={onLayout}
      marginRight="m"
      hitSlop={hitSlop}
      alignItems="center"
    >
      {Icon && (
        <Icon
          height={iconSize || 20}
          width={iconSize || 20}
          color={iconColorValue}
        />
      )}
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

export type TabBarOption = {
  title: string
  value: string
  Icon?: FC<SvgProps>
  iconSize?: number
  iconColor?: Color
}

type Props = {
  tabBarOptions: Array<TabBarOption>
  selectedValue: string
  onItemSelected: (value: string) => void
} & TouchableOpacityBoxProps

const TabBar = ({
  tabBarOptions,
  selectedValue,
  onItemSelected,
  ...containerProps
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
    <Box {...containerProps}>
      <Box flexDirection="row" justifyContent="center" paddingVertical="ms">
        {tabBarOptions.map((o) => (
          <TabBarItem
            key={o.value}
            selected={o.value === selectedValue}
            onLayout={handleLayout(o.value)}
            onPress={handlePress(o.value)}
            hitSlop={hitSlop}
            {...o}
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
