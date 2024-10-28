import React from 'react'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useColors, useTextVariants } from '@theme/themeHooks'
import { TextInput, TextInputProps } from 'react-native'
import Box from './Box'
import Text from './Text'

type SearchProps = BoxProps<Theme> & {
  label: string
  textInputProps?: TextInputProps
}

const TextInputNew = ({ label, textInputProps, ...rest }: SearchProps) => {
  const textVariants = useTextVariants()
  const colors = useColors()
  return (
    <Box
      flexDirection="column"
      alignItems="flex-start"
      gap="xs"
      padding="xl"
      backgroundColor="cardBackground"
      borderRadius="2xl"
      {...rest}
    >
      <Text variant="textLgSemibold">{label}</Text>
      <TextInput
        placeholderTextColor={colors['text.placeholder']}
        selectionColor={colors.primaryText}
        style={{
          fontFamily: textVariants.textLgSemibold.fontFamily,
          fontWeight: 'bold',
          fontSize: textVariants.textLgSemibold.fontSize,
          color: colors.primaryText,
        }}
        {...textInputProps}
      />
    </Box>
  )
}

export default TextInputNew
