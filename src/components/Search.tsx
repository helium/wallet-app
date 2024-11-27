import React from 'react'
import SearchIcon from '@assets/svgs/searchIcon.svg'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@config/theme/theme'
import { useColors, useTextVariants } from '@config/theme/themeHooks'
import { TextInput } from 'react-native'
import Box from './Box'

type SearchProps = BoxProps<Theme> & {
  placeholder: string
  onChangeText: (text: string) => void
  onEnter?: () => void
}

export const Search = ({
  placeholder,
  onChangeText,
  onEnter,
  ...rest
}: SearchProps) => {
  const textVariants = useTextVariants()
  const colors = useColors()
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="xs"
      paddingHorizontal="xl"
      paddingVertical="lg"
      backgroundColor="cardBackground"
      borderRadius="2xl"
      {...rest}
    >
      <SearchIcon />
      <TextInput
        placeholderTextColor={colors['text.placeholder']}
        placeholder={placeholder}
        onChangeText={onChangeText}
        selectionColor={colors.primaryText}
        onSubmitEditing={onEnter}
        style={{
          fontFamily: textVariants.textLgSemibold.fontFamily,
          fontWeight: 'bold',
          fontSize: textVariants.textLgSemibold.fontSize,
          color: colors.primaryText,
        }}
      />
    </Box>
  )
}
