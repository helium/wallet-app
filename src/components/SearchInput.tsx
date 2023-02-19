/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React from 'react'
import Search from '@assets/images/search.svg'
import { BorderRadii, Color, Spacing, Theme } from '@theme/theme'
import { useColors, useInputVariants } from '@theme/themeHooks'
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
    regular: { borderRadius, padding, color },
  } = useInputVariants()
  const colors = useColors()
  return (
    <Box
      {...boxProps}
      backgroundColor="secondary"
      borderRadius={borderRadius as BorderRadii}
      paddingStart={padding as Spacing}
      flexDirection="row"
      alignItems="center"
    >
      <Search color={colors[color as Color]} />
      <TextInput
        textInputProps={{
          onChangeText,
          value,
          placeholder,
          autoCorrect: false,
          autoComplete: 'off',
        }}
        variant={variant || 'transparent'}
        backgroundColor="red500"
      />
    </Box>
  )
}

export default SearchInput
