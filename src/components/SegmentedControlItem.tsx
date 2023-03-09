/* eslint-disable react/jsx-props-no-spreading */
import React, { memo } from 'react'
import { Spacing } from '@theme/theme'
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
  padding?: Spacing
}
const SegmentedControlItem = ({
  isFirst,
  isLast,
  selected,
  onChange,
  padding,
  ...props
}: Props) => {
  return (
    <ButtonPressable
      borderTopLeftRadius={isFirst ? 'xl' : 'none'}
      borderBottomLeftRadius={isFirst ? 'xl' : 'none'}
      borderTopRightRadius={isLast ? 'xl' : 'none'}
      borderBottomRightRadius={isLast ? 'xl' : 'none'}
      alignItems="center"
      justifyContent="center"
      flex={1}
      backgroundColor="surfaceSecondary"
      fontSize={19}
      fontWeight="400"
      backgroundColorPressed="white"
      backgroundColorOpacityPressed={0.3}
      titleColor="primaryText"
      titleColorPressed="primaryText"
      titleColorOpacity={selected ? 1 : 0.3}
      titleColorPressedOpacity={0.7}
      onPress={onChange}
      innerContainerProps={{ padding }}
      {...props}
    />
  )
}

export default memo(SegmentedControlItem)
