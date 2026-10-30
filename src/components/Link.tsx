import React, { ReactNode } from 'react'
import { Linking } from 'react-native'
import Text from './Text'

type Props = { children?: ReactNode; href?: string }
const Link = ({ children, href }: Props) => (
  <Text
    variant="body2"
    onPress={() => {
      if (href) void Linking.openURL(href).catch(console.error)
    }}
  >
    {children}
  </Text>
)

export default Link
