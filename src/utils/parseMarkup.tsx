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

const symbols: Record<string, React.JSX.Element> = {
  b: <Text fontWeight="700" variant="textSmRegular" />,
  light: <Text fontWeight="200" variant="textSmRegular" />,
  blue: <Text color="blue.light-500" variant="textSmRegular" />,
  green: <Text color="green.light-500" variant="textSmRegular" />,
  purple: <Text color="purple.500" variant="textSmRegular" />,
  red: <Text color="error.500" variant="textSmRegular" />,
  orange: <Text color="orange.500" variant="textSmRegular" />,
  gray: <Text color="gray.500" variant="textSmRegular" />,
  center: <Text textAlign="center" variant="textSmRegular" />,
  a: <Link />,
  bullet: <Bullet />,
  default: <Text variant="textSmRegular" color="primaryText" />,
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
