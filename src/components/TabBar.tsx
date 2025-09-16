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
import useHaptic from '@hooks/useHaptic'
import { Color } from '@theme/theme'
import { useColors, useVerticalHitSlop } from '@theme/themeHooks'
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
  iconPosition,
  value,
  stretch,
}: {
  selected: boolean
  onPress: () => void
  onLayout: (event: LayoutChangeEvent) => void
  hitSlop: Insets | undefined
  stretch: boolean
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
      marginRight={stretch ? 'none' : 'm'}
      hitSlop={hitSlop}
      alignItems="center"
      flexGrow={stretch ? 1 : undefined}
      flex={stretch ? 1 : undefined}
      flexDirection={
        iconPosition === 'top' || iconPosition === undefined ? 'column' : 'row'
      }
    >
      {Icon && (
        <Box
          marginEnd={
            iconPosition === 'top' || iconPosition === undefined
              ? undefined
              : 's'
          }
        >
          <Icon
            height={iconSize || 20}
            width={iconSize || 20}
            color={iconColorValue}
          />
        </Box>
      )}
      {title && (
        <Text
          variant="subtitle2"
          color={selected ? 'primaryText' : 'secondaryText'}
          minWidth={
            iconPosition === 'top' || iconPosition === undefined ? 75 : 0
          }
          textAlign="center"
        >
          {title}
        </Text>
      )}
    </TouchableOpacityBox>
  )
}

export type TabBarOption = {
  title?: string
  value: string
  Icon?: FC<SvgProps>
  iconSize?: number
  iconColor?: Color
  iconPosition?: 'top' | 'leading'
}

type Props = {
  tabBarOptions: Array<TabBarOption>
  selectedValue: string
  onItemSelected: (value: string) => void
  stretchItems?: boolean
  hasDivider?: boolean
  hasIndicator?: boolean
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const TabBar = ({
  tabBarOptions,
  selectedValue,
  onItemSelected,
  stretchItems = false,
  hasDivider = true,
  hasIndicator = true,
  ...containerProps
}: Props) => {
  const hitSlop = useVerticalHitSlop('l')
  const [itemRects, setItemRects] = useState<Record<string, LayoutRectangle>>()
  const offset = useSharedValue<number | null>(null)
  const { triggerImpact } = useHaptic()

  const handleLayout = useCallback(
    (value: string) => (e: LayoutChangeEvent) => {
      e.persist()

      setItemRects((x) => ({ ...x, [value]: e.nativeEvent.layout }))
    },
    [],
  )

  const handlePress = useCallback(
    (value: string) => () => {
      triggerImpact('light')
      onItemSelected(value)
    },
    [onItemSelected, triggerImpact],
  )

  useEffect(() => {
    const nextOffset = itemRects?.[selectedValue]?.x || 0

    if (offset.value === null) {
      // Don't animate on first position update
      offset.value = nextOffset
      return
    }

    offset.value = withSpring(nextOffset, { mass: 0.5 })
  }, [itemRects, offset, selectedValue])

  const animatedStyles = useAnimatedStyle(() => {
    if (offset.value === null) return {}
    return {
      transform: [
        {
          translateX: offset.value,
        },
      ],
    }
  })

  const items = useMemo(() => {
    return tabBarOptions.map((o) => (
      <TabBarItem
        stretch={stretchItems}
        key={o.value}
        selected={o.value === selectedValue}
        onLayout={handleLayout(o.value)}
        onPress={handlePress(o.value)}
        hitSlop={hitSlop}
        {...o}
      />
    ))
  }, [
    handleLayout,
    handlePress,
    hitSlop,
    selectedValue,
    stretchItems,
    tabBarOptions,
  ])

  return (
    <Box {...containerProps}>
      <Box flexDirection="row" justifyContent="center" paddingVertical="ms">
        {items}
      </Box>
      {hasIndicator && (
        <Animated.View style={animatedStyles}>
          <Box
            backgroundColor="primaryText"
            height={3}
            position="absolute"
            bottom={0.5}
            width={itemRects?.[selectedValue]?.width || 0}
          />
        </Animated.View>
      )}
      {hasDivider && <Box backgroundColor="black200" height={1} width="100%" />}
    </Box>
  )
}

export default memo(TabBar)
