/* eslint-disable react/jsx-props-no-spreading */
import Search from '@assets/images/search.svg'
import { BoxProps } from '@shopify/restyle'
import { BorderRadii, Spacing, Theme } from '@theme/theme'
import { useColors, useInputVariants } from '@theme/themeHooks'
import React, { useCallback } from 'react'
import { TextInputProps } from 'react-native'
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
}
const SearchInput = ({
  placeholder,
  value,
  onChangeText,
  onEnter,
  variant,
  autoFocus = false,
  textInputProps = {},
  ...boxProps
}: Props) => {
  const {
    regular: { borderRadius, padding },
  } = useInputVariants()
  const colors = useColors()

  const handleSubmitEditing = useCallback(() => {
    if (value && onEnter) {
      onEnter(value)
    }
  }, [value, onEnter])

  return (
    <Box
      backgroundColor="fg.quinary-400"
      borderRadius={borderRadius as BorderRadii}
      paddingStart={padding as Spacing}
      flexDirection="row"
      alignItems="center"
      {...boxProps}
    >
      <Search color={colors.primaryBackground} />
      <TextInput
        fontSize={16}
        fontWeight="normal"
        textColor="primaryBackground"
        textInputProps={{
          onChangeText,
          onSubmitEditing: handleSubmitEditing,
          value,
          placeholder,
          placeholderTextColor: colors.primaryBackground,
          autoCorrect: false,
          selectionColor: colors.primaryBackground,
          autoComplete: 'off',
          autoFocus,
          ...textInputProps,
        }}
        variant={variant || 'transparent'}
        backgroundColor="error.500"
      />
    </Box>
  )
}

export default SearchInput
