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
import { useColors, useVerticalHitSlop } from '@theme/themeHooks'
import Box from './Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from './TouchableOpacityBox'

export const NavBarHeight = 76

export type ServiceNavBarOption = {
  value: string
  Icon: FC<SvgProps>
  iconProps?: SvgProps
}

const NavBarItem = ({
  selected,
  onLayout,
  onPress,
  onLongPress,
  hitSlop,
  Icon,
  value,
  iconProps,
}: {
  selected: boolean
  onPress: () => void
  onLongPress?: () => void
  onLayout: (event: LayoutChangeEvent) => void
  hitSlop: Insets | undefined
} & ServiceNavBarOption) => {
  const colors = useColors()

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 1,
        },
      ],
    }
  })

  return (
    <TouchableOpacityBox
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : {}}
      accessibilityLabel={value}
      onLongPress={onLongPress}
      key={value}
      onPress={onPress}
      onLayout={onLayout}
      marginRight="0"
      hitSlop={hitSlop}
      alignItems="center"
      justifyContent="center"
    >
      <Animated.View style={animatedStyles}>
        <Box
          backgroundColor={selected ? 'primaryBackground' : 'transparent'}
          height={60}
          width={60}
          borderRadius="full"
          justifyContent="center"
          alignItems="center"
        />
      </Animated.View>
      <Box
        justifyContent="center"
        alignItems="center"
        position="absolute"
        top={0}
        bottom={0}
      >
        <Icon
          color={selected ? colors.primaryText : colors['fg.tertiary-600']}
          {...iconProps}
        />
      </Box>
    </TouchableOpacityBox>
  )
}

type NavServiceBarProps = {
  navBarOptions: Array<ServiceNavBarOption>
  selectedValue: string
  onItemSelected: (value: string) => void
  onItemLongPress: (value: string) => void
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const NavServiceNavBar = ({
  navBarOptions,
  selectedValue,
  onItemSelected,
  onItemLongPress,
  ...containerProps
}: NavServiceBarProps) => {
  const hitSlop = useVerticalHitSlop('6')
  const [itemRects, setItemRects] = useState<Record<string, LayoutRectangle>>()

  const offset = useSharedValue<number | null>(null)

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

  const handleLongPress = useCallback(
    (value: string) => () => {
      onItemLongPress(value)
    },
    [onItemLongPress],
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

  const items = useMemo(() => {
    return navBarOptions.map((o) => (
      <NavBarItem
        key={o.value}
        {...o}
        selected={o.value === selectedValue}
        onLayout={handleLayout(o.value)}
        onPress={handlePress(o.value)}
        onLongPress={handleLongPress(o.value)}
        hitSlop={hitSlop}
      />
    ))
  }, [
    handleLayout,
    handleLongPress,
    handlePress,
    hitSlop,
    navBarOptions,
    selectedValue,
  ])

  return (
    <Box
      {...containerProps}
      paddingHorizontal="2xl"
      flexDirection="row"
      flex={1}
      shadowColor="base.black"
      shadowOpacity={0.3}
      shadowOffset={{ width: 0, height: 6 }}
      shadowRadius={6}
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor="primaryText"
        borderRadius="full"
        padding="md"
        flex={1}
        gap="2"
      >
        {items}
      </Box>
    </Box>
  )
}

export default memo(NavServiceNavBar)
