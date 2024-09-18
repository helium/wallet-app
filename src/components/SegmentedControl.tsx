import React, { memo, useCallback, useMemo } from 'react'
import { Box, ReAnimatedBox, Text } from '.'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '../theme/theme'
import useLayoutWidth from '@hooks/useLayoutWidth'
import { GestureResponderEvent } from 'react-native'
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import TouchableOpacityBox from './TouchableOpacityBox'

type Option = { value: string; label: string }

const SegmentedItem = ({
  option,
  selected,
  onSelected,
}: {
  option: Option
  selected: boolean
  onSelected: ((event: GestureResponderEvent) => void) | undefined
}) => {
  return (
    <TouchableOpacityBox flex={1} onPress={onSelected}>
      <Text
        paddingVertical="4"
        variant="textLgRegular"
        color={selected ? 'primaryBackground' : 'primaryText'}
        textAlign="center"
      >
        {option.label}
      </Text>
    </TouchableOpacityBox>
  )
}

type Props = {
  options: Option[]
  selectedIndex: number
  onItemSelected: (index: number) => void
} & BoxProps<Theme>
const SegmentedControl = ({
  options,
  onItemSelected,
  selectedIndex,
  ...boxProps
}: Props) => {
  const [containerWidth, setContainerWidth] = useLayoutWidth()

  const itemWidth = useMemo(
    () => containerWidth / options.length,
    [containerWidth, options.length],
  )

  const handleItemSelected = useCallback(
    (index: number) => () => {
      onItemSelected(index)
    },
    [onItemSelected],
  )

  const selectedStyle = useAnimatedStyle(() => {
    return {
      left: withSpring(itemWidth * selectedIndex, {
        stiffness: 70,
      }),
    }
  }, [itemWidth, selectedIndex])

  return (
    <Box
      backgroundColor="cardBackground"
      padding="0.5"
      paddingHorizontal="1.5"
      borderRadius="4xl"
      borderWidth={1}
      borderColor="border.primary"
    >
      <Box
        borderRadius="4xl"
        {...boxProps}
        onLayout={setContainerWidth}
        flexDirection="row"
        width="100%"
        position="relative"
      >
        <ReAnimatedBox
          width={itemWidth}
          backgroundColor="primaryText"
          borderRadius="4xl"
          position="absolute"
          bottom={5}
          top={5}
          style={selectedStyle}
        />
        {options.map((option, index) => (
          <SegmentedItem
            key={option.value}
            option={option}
            selected={index === selectedIndex}
            onSelected={handleItemSelected(index)}
          />
        ))}
      </Box>
    </Box>
  )
}

export default memo(SegmentedControl)
