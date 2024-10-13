import React, {
  FC,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { BoxProps } from '@shopify/restyle'
import { GestureResponderEvent, LayoutChangeEvent } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useColors } from '@theme/themeHooks'
import { Theme } from '../theme/theme'
import { Box, ReAnimatedBox, Text } from '.'
import TouchableOpacityBox from './TouchableOpacityBox'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { debounce as lodashDebounce } from 'lodash'

type Option = {
  value: string | number
  label: string
  Icon?: FC<SvgProps>
  iconProps?: SvgProps
}

const SegmentedItem = ({
  option,
  selected,
  onSelected,
  onSetWidth,
  fullWidth,
}: {
  option: Option
  selected: boolean
  onSelected: ((event: GestureResponderEvent) => void) | undefined
  onSetWidth: (width: number) => void
  fullWidth?: boolean
}) => {
  const { primaryBackground, ...colors } = useColors()
  const [hasTouched, setHasTouched] = useState(false)

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onSetWidth(e.nativeEvent.layout.width)
    },
    [onSetWidth],
  )

  const initialBackgroundColor = useMemo(
    () => (selected ? 'primaryText' : 'transparent'),
    [selected],
  )

  const backgroundColor = useMemo(() => {
    if (!hasTouched) return initialBackgroundColor

    return 'transparent'
  }, [initialBackgroundColor, selected])

  const onPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      setHasTouched(true)
      onSelected && onSelected(event)
    },
    [onSelected],
  )

  return (
    <TouchableOpacityBox
      flex={fullWidth ? 1 : undefined}
      paddingVertical="1.5"
      paddingHorizontal="3"
      justifyContent="center"
      alignItems="center"
      onPress={onPressHandler}
      onLayout={onLayout}
      gap="sm"
      flexDirection="row"
      backgroundColor={backgroundColor}
      borderRadius="full"
    >
      {option.Icon && (
        <option.Icon
          color={selected ? primaryBackground : colors['fg.quinary-400']}
          {...option.iconProps}
        />
      )}
      <Text
        variant="textLgSemibold"
        fontSize={17}
        color={selected ? 'primaryBackground' : 'fg.quinary-400'}
        textAlign="center"
      >
        {option.label}
      </Text>
    </TouchableOpacityBox>
  )
}
export type SegmentedControlRef = {
  selectedIndex: number
}

type Props = {
  options: Option[]
  onItemSelected: (index: number) => void
  fullWidth?: boolean
} & BoxProps<Theme>

const SegmentedControl = forwardRef(
  (
    { options, onItemSelected, fullWidth, ...boxProps }: Props,
    ref: Ref<SegmentedControlRef>,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [hasTouched, setHasTouched] = useState(false)

    useImperativeHandle(ref, () => ({ selectedIndex }))

    const [optionWidths, setOptionWidths] = useState(
      Array(options.length).fill(0),
    )

    const itemWidth = useMemo(
      () => optionWidths[selectedIndex],
      [optionWidths, selectedIndex],
    )

    const handleItemSelected = useCallback(
      (index: number) => () => {
        setHasTouched(true)
        setSelectedIndex(index)
        onItemSelected(index)
      },
      [onItemSelected],
    )

    const leftPosition = useMemo(() => {
      return optionWidths
        .slice(0, selectedIndex)
        .reduce((acc, width) => (selectedIndex === 0 ? 0 : acc + width), 0)
    }, [optionWidths, selectedIndex])

    const onSetWidth = useCallback(
      (index: number) => (width: number) => {
        setOptionWidths((prev) => {
          const newOptionWidths = [...prev]
          newOptionWidths[index] = width
          return newOptionWidths
        })
      },
      [],
    )

    const animatedStyle = useAnimatedStyle(() => {
      return {
        left: withTiming(leftPosition, { duration: 200 }),
        width: withTiming(itemWidth, { duration: hasTouched ? 200 : 0 }),
      }
    }, [leftPosition, itemWidth, hasTouched])

    return (
      <Box borderRadius="4xl" alignItems="center">
        <Box
          borderRadius="4xl"
          {...boxProps}
          flexDirection="row"
          position="relative"
        >
          <ReAnimatedBox
            position="absolute"
            width={itemWidth}
            height="100%"
            backgroundColor="primaryText"
            style={[animatedStyle]}
            borderRadius="4xl"
          />
          {options.map((option, index) => (
            <SegmentedItem
              fullWidth={fullWidth}
              key={option.value}
              option={option}
              selected={index === selectedIndex}
              onSelected={handleItemSelected(index)}
              onSetWidth={onSetWidth(index)}
            />
          ))}
        </Box>
      </Box>
    )
  },
)

export default memo(SegmentedControl)
