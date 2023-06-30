/* eslint-disable react/jsx-props-no-spreading */
import { BoxProps } from '@shopify/restyle'
import React, { useCallback } from 'react'
import Search from '@assets/images/search.svg'
import { BorderRadii, Color, Spacing, Theme } from '@theme/theme'
import { useColors, useInputVariants } from '@theme/themeHooks'
import Box from './Box'
import TextInput from './TextInput'

type Props = BoxProps<Theme> & {
  placeholder: string
  value?: string
  onChangeText?: (text: string) => void
  onEnter?: (text: string) => void
  variant?: 'plain' | 'regular' | 'underline'
  autoFocus?: boolean
}
const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onEnter,
  variant,
  autoFocus = false,
  ...boxProps
}: Props) => {
  const {
    regular: { borderRadius, padding, color },
  } = useInputVariants()
  const colors = useColors()

  const handleSubmitEditing = useCallback(() => {
    if (value && onEnter) {
      onEnter(value)
    }
  }, [value, onEnter])

  return (
    <Box
      backgroundColor="secondary"
      borderRadius={borderRadius as BorderRadii}
      paddingStart={padding as Spacing}
      flexDirection="row"
      alignItems="center"
      {...boxProps}
    >
      <Search color={colors[color as Color]} />
      <TextInput
        textInputProps={{
          onChangeText,
          onSubmitEditing: handleSubmitEditing,
          value,
          placeholder,
          autoCorrect: false,
          autoComplete: 'off',
          autoFocus,
        }}
        variant={variant || 'transparent'}
        backgroundColor="red500"
      />
    </Box>
  )
}

export default SearchInput
