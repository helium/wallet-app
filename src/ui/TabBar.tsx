import { SPRING } from '@theme/motion'
import React, { useEffect, useState } from 'react'
import {
  type LayoutChangeEvent,
  type LayoutRectangle,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { PressableScale } from './PressableScale'
import { Text } from './Text'
import { twMerge } from './twMerge'

export type TabBarOption = {
  title: string
  value: string
}

export type TabBarProps = {
  tabBarOptions: Array<TabBarOption>
  selectedValue: string
  onItemSelected: (value: string) => void
  className?: string
}

const HIT_SLOP = { top: 24, bottom: 24 }

// A row of text tabs over a divider. An indicator springs under the selected
// tab.
export const TabBar = ({
  tabBarOptions,
  selectedValue,
  onItemSelected,
  className,
}: TabBarProps) => {
  const [itemRects, setItemRects] = useState<Record<string, LayoutRectangle>>()
  const offset = useSharedValue<number | null>(null)

  const handleLayout = (value: string) => (e: LayoutChangeEvent) => {
    const { layout } = e.nativeEvent
    setItemRects((x) => ({ ...x, [value]: layout }))
  }

  useEffect(() => {
    const nextOffset = itemRects?.[selectedValue]?.x || 0

    if (offset.get() === null) {
      // Don't animate on first position update
      offset.set(nextOffset)
      return
    }

    offset.set(withSpring(nextOffset, SPRING.settle))
  }, [itemRects, offset, selectedValue])

  const animatedStyles = useAnimatedStyle(() => {
    const translateX = offset.get()
    if (translateX === null) return {}
    return { transform: [{ translateX }] }
  })

  return (
    <View className={className}>
      <View className="flex-row justify-center py-3">
        {tabBarOptions.map(({ title, value }) => {
          const selected = value === selectedValue
          return (
            <PressableScale
              key={value}
              feedback="opacity"
              className="mr-4 items-center"
              hitSlop={HIT_SLOP}
              onLayout={handleLayout(value)}
              onPress={() => onItemSelected(value)}
            >
              <Text
                size="lg"
                className={twMerge(
                  'min-w-[75px] text-center font-medium',
                  selected ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {title}
              </Text>
            </PressableScale>
          )
        })}
      </View>
      <Animated.View style={animatedStyles}>
        <View
          className="absolute bottom-[0.5px] h-[3px] bg-foreground"
          style={{ width: itemRects?.[selectedValue]?.width || 0 }}
        />
      </Animated.View>
      <View className="h-px w-full bg-border" />
    </View>
  )
}
