import React, { ReactNode } from 'react'
import { Linking, View, ViewStyle } from 'react-native'
import parse5, {
  DefaultTreeElement,
  DefaultTreeNode,
  DefaultTreeParentNode,
  DefaultTreeTextNode,
} from 'parse5'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Text } from '@ui/Text'
import * as Logger from './logger'

const MarkupLink = ({
  children,
  href,
}: {
  children?: ReactNode
  href?: string
}) => (
  <Text
    accessibilityRole="link"
    onPress={() => {
      if (href) void Linking.openURL(href).catch(console.error)
    }}
  >
    {children}
  </Text>
)

// `color` comes from the markup's attribute.
const MarkupBullet = ({
  children,
  color,
  style = {},
}: {
  children?: ReactNode
  color?: string
  style?: ViewStyle
}) => (
  <View className="mb-2 flex-row items-start" style={style}>
    <Text
      className="mr-2 text-2xl leading-[22px]"
      style={color ? { color } : undefined}
    >
      &bull;
    </Text>
    <Text className="w-[90%] text-muted-foreground">{children}</Text>
  </View>
)

const symbols: Record<string, React.JSX.Element> = {
  b: <Text className="font-bold" />,
  light: <Text className="font-light" />,
  blue: <Text className="text-blue-dark-500" />,
  green: <Text className="text-success-500" />,
  purple: <Text className="text-purple-500" />,
  red: <Text className="text-destructive" />,
  orange: <Text className="text-warning-500" />,
  gray: <Text className="text-muted-foreground" />,
  center: <Text className="text-center" />,
  a: <MarkupLink />,
  bullet: <MarkupBullet />,
  default: <Text />,
}

const parseMarkup = (
  rawText: string,
  OuterComponent?: React.JSX.Element,
  style?: ViewStyle,
) => {
  if (!rawText) return rawText
  if (!rawText.match(/<.*>.*<\/.*>/)) {
    if (OuterComponent) {
      const prevStyle = get(OuterComponent, 'props.style', {})
      return {
        ...OuterComponent,
        props: {
          ...OuterComponent.props,
          style: { ...prevStyle, ...style },
          children: rawText,
        },
      }
    }
    return rawText
  }

  const doc = parse5.parse(
    rawText.replace(/[“]+/g, '"'),
  ) as DefaultTreeParentNode
  const body = (doc.childNodes[0] as DefaultTreeParentNode)
    .childNodes[1] as DefaultTreeParentNode
  const values = body.childNodes.map(parseNode).flat(Infinity)

  if (OuterComponent && typeof values[0] === 'string') {
    const prevStyle = get(OuterComponent, 'props.style', {})
    return {
      ...OuterComponent,
      props: {
        ...OuterComponent.props,
        style: { ...prevStyle, ...style },
        children: values,
      },
    }
  }

  if (!isEmpty(style)) {
    const prevStyle = get(values[0], 'props.style', {})
    values[0] = {
      ...(values[0] as React.JSX.Element),
      props: {
        ...(values[0] as React.JSX.Element).props,
        style: { ...prevStyle, ...style },
      },
    }
  }

  return values
}

const parseNode = (
  node: DefaultTreeTextNode | DefaultTreeElement | DefaultTreeNode,
): string | React.JSX.Element => {
  if (node.nodeName === '#text') return (node as DefaultTreeTextNode).value

  const element = node as DefaultTreeElement

  const symbol = symbols[element.tagName] || symbols.default
  if (!symbols[element.tagName]) {
    Logger.breadcrumb(`Unknown markup symbol <${element.tagName}>`)
  }

  const attrs = element.attrs.reduce(
    (acc, { name, value }) => ({ ...acc, [name]: value }),
    {},
  )

  return {
    ...symbol,
    props: {
      ...symbol.props,
      ...attrs,
      children: element.childNodes.map(parseNode),
    },
    key: Math.random().toString(),
  }
}

export default parseMarkup
