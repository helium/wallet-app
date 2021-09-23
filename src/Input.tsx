/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import {
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native'

type Props = {
  title: string
  textProps?: TextProps
  inputProps?: TextInputProps
  style?: ViewStyle
}
const Input = ({ style, title, textProps, inputProps }: Props) => {
  return (
    <View style={style}>
      <Text {...textProps}>{title}</Text>
      <TextInput {...inputProps} />
    </View>
  )
}

export default Input
