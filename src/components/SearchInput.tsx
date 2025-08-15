/* eslint-disable react/jsx-props-no-spreading */
import Search from '@assets/images/search.svg'
import { BoxProps } from '@shopify/restyle'
import { BorderRadii, Color, Spacing, Theme } from '@theme/theme'
import { useColors, useInputVariants } from '@theme/themeHooks'
import React, { useCallback } from 'react'
import { TextInput as RNTextInput, TextInputProps } from 'react-native'
import Box from './Box'
import TextInput from './TextInput'

type Props = BoxProps<Theme> & {
  placeholder: string
  value?: string
  onChangeText?: (text: string) => void
  onEnter?: (text: string) => void
  variant?: 'plain' | 'regular' | 'underline'
  autoFocus?: boolean
  textInputProps?: TextInputProps
  ref?: React.RefObject<RNTextInput | null>
}
const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onEnter,
  variant,
  autoFocus = false,
  textInputProps = {},
  ref,
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
        ref={ref}
        fontSize={14}
        fontWeight="normal"
        textInputProps={{
          onChangeText,
          onSubmitEditing: handleSubmitEditing,
          value,
          placeholder,
          autoCorrect: false,
          autoComplete: 'off',
          autoFocus,
          ...textInputProps,
        }}
        variant={variant || 'transparent'}
        backgroundColor="red500"
      />
    </Box>
  )
}

export default SearchInput
