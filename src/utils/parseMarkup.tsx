/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { ViewStyle } from 'react-native'
import parse5, {
  DefaultTreeElement,
  DefaultTreeNode,
  DefaultTreeParentNode,
  DefaultTreeTextNode,
} from 'parse5'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Text from '@components/Text'
import Link from '@components/Link'
import Bullet from '@components/Bullet'
import * as Logger from './logger'

const symbols: Record<string, JSX.Element> = {
  b: <Text fontWeight="700" variant="body2" />,
  light: <Text fontWeight="200" variant="body2" />,
  blue: <Text color="blueBright500" variant="body2" />,
  green: <Text color="greenBright500" variant="body2" />,
  purple: <Text color="purple500" variant="body2" />,
  red: <Text color="red500" variant="body2" />,
  orange: <Text color="orange500" variant="body2" />,
  gray: <Text color="grey500" variant="body2" />,
  center: <Text textAlign="center" variant="body2" />,
  a: <Link />,
  bullet: <Bullet />,
  default: <Text variant="body2" color="primaryText" />,
}

const parseMarkup = (
  rawText: string,
  OuterComponent?: JSX.Element,
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
      ...(values[0] as JSX.Element),
      props: {
        ...(values[0] as JSX.Element).props,
        style: { ...prevStyle, ...style },
      },
    }
  }

  return values
}

const parseNode = (
  node: DefaultTreeTextNode | DefaultTreeElement | DefaultTreeNode,
): string | JSX.Element => {
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
