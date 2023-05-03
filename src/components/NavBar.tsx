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

export const NavBarHeight = 60

const NavBarItem = ({
  selected,
  onLayout,
  onPress,
  onLongPress,
  hitSlop,
  Icon,
  value,
  hasBadge,
}: {
  selected: boolean
  onPress: () => void
  onLongPress?: () => void
  onLayout: (event: LayoutChangeEvent) => void
  hitSlop: Insets | undefined
  hasBadge?: boolean
} & NavBarOption) => {
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
      marginRight="none"
      hitSlop={hitSlop}
      alignItems="center"
      flexGrow={1}
      flex={1}
    >
      <Animated.View style={animatedStyles}>
        <Box
          backgroundColor={selected ? 'white' : 'transparent'}
          height={30}
          width={30}
          borderRadius="round"
          justifyContent="center"
          alignItems="center"
        />
      </Animated.View>
      <Box position="absolute" top={0}>
        <Icon
          height={30}
          width={30}
          color={selected ? colors.black : colors.white}
        />
        {hasBadge && (
          <Box
            position="absolute"
            justifyContent="center"
            alignItems="center"
            top={6}
            right={2}
            backgroundColor={selected ? 'white' : 'black'}
            borderRadius="round"
            height={10}
            width={10}
          >
            <Box
              backgroundColor={selected ? 'black' : 'malachite'}
              borderRadius="round"
              height={6}
              width={6}
            />
          </Box>
        )}
      </Box>
    </TouchableOpacityBox>
  )
}

export type NavBarOption = {
  value: string
  Icon: FC<SvgProps>
  hasBadge?: boolean
}

type Props = {
  navBarOptions: Array<NavBarOption>
  selectedValue: string
  onItemSelected: (value: string) => void
  onItemLongPress: (value: string) => void
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const NavBar = ({
  navBarOptions,
  selectedValue,
  onItemSelected,
  onItemLongPress,
  ...containerProps
}: Props) => {
  const hitSlop = useVerticalHitSlop('l')
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
        selected={o.value === selectedValue}
        onLayout={handleLayout(o.value)}
        onPress={handlePress(o.value)}
        onLongPress={handleLongPress(o.value)}
        hitSlop={hitSlop}
        {...o}
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
    <Box {...containerProps}>
      <Box flexDirection="row" justifyContent="center" paddingVertical="ms">
        {items}
      </Box>
    </Box>
  )
}

export default memo(NavBar)
