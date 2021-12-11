/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React from 'react'
import Search from '@assets/images/search.svg'
import { BorderRadii, Color, Spacing, Theme } from '../theme/theme'
import { useColors, useInputVariants } from '../theme/themeHooks'
import Box from './Box'
import TextInput from './TextInput'

type Props = BoxProps<Theme> & {
  placeholder: string
  value?: string
  onChangeText?: (text: string) => void
  variant?: 'plain' | 'regular' | 'underline'
}
const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  variant,
  ...boxProps
}: Props) => {
  const {
    regular: { backgroundColor, borderRadius, padding, color },
  } = useInputVariants()
  const colors = useColors()
  return (
    <Box
      {...boxProps}
      backgroundColor={backgroundColor as Color}
      borderRadius={borderRadius as BorderRadii}
      paddingStart={padding as Spacing}
      flexDirection="row"
      alignItems="center"
    >
      <Search color={colors[color as Color]} />
      <TextInput
        onChangeText={onChangeText}
        value={value}
        variant={variant || 'regular'}
        placeholder={placeholder}
        autoCorrect={false}
        autoComplete="off"
      />
    </Box>
  )
}

export default SearchInput
