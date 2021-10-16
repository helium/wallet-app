/* eslint-disable react/jsx-props-no-spreading */
import React, { memo } from 'react'
import { useColorScheme } from 'react-native'
import ButtonPressable from './ButtonPressable'

type Props = {
  isFirst: boolean
  isLast: boolean
  selected: boolean
  onChange: () => void
  title: string
  height?: number | string
  minHeight?: number | string
  maxHeight?: number | string
  disabled: boolean
}
const SegmentedControlItem = ({
  isFirst,
  isLast,
  selected,
  onChange,
  ...props
}: Props) => {
  const colorScheme = useColorScheme()
  return (
    <ButtonPressable
      borderTopLeftRadius={isFirst ? 'xl' : 'none'}
      borderBottomLeftRadius={isFirst ? 'xl' : 'none'}
      borderTopRightRadius={isLast ? 'xl' : 'none'}
      borderBottomRightRadius={isLast ? 'xl' : 'none'}
      alignItems="center"
      justifyContent="center"
      flex={1}
      backgroundColor="surface"
      fontSize={19}
      fontWeight="400"
      backgroundColorPressed="white"
      backgroundColorOpacityPressed={0.3}
      backgroundColorOpacity={colorScheme === 'light' ? 1 : 0.4}
      titleColor="primaryText"
      titleColorPressed="primaryText"
      titleColorOpacity={selected ? 1 : 0.3}
      titleColorPressedOpacity={0.7}
      onPress={onChange}
      {...props}
    />
  )
}

export default memo(SegmentedControlItem)
