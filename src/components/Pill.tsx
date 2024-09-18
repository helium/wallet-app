import Box from '@components/Box'
import { TextProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'
import Text from './Text'

type Color =
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'black'
  | 'iotGreen'
  | 'mobileBlue'
  | 'hntBlue'
export const Pill = memo(
  ({
    text,
    Icon,
    color,
    textProps = {},
    iconProps = {},
  }: {
    text?: string
    color: Color
    Icon?: React.FC<SvgProps>
    textProps?: TextProps<Theme>
    iconProps?: SvgProps
  }) => {
    const colorDefs = {
      blue: {
        border: 'blueBorder',
        background: 'blue950',
        text: 'blue.500',
      },
      green: {
        border: 'green.300',
        background: 'green.950',
        text: 'green.500',
      },
      red: {
        border: 'ros.300',
        background: 'ros.950',
        text: 'ros.500',
      },
      orange: {
        border: 'orange.300',
        background: 'orange.950',
        text: 'orange.500',
      },
      black: {
        background: 'black',
        text: 'base.white',
        border: 'black',
      },
      hntBlue: {
        background: 'hntBlue',
        text: 'base.white',
        border: 'black',
      },
      iotGreen: {
        background: 'iotGreen',
        text: 'base.white',
        border: 'black',
      },
      mobileBlue: {
        background: 'mobileBlue',
        text: 'base.white',
        border: 'black',
      },
    }
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        borderRadius="4xl"
        padding="xs"
        borderWidth={2}
        borderColor={colorDefs[color].border as any}
        backgroundColor={colorDefs[color].background as any}
      >
        {Icon ? (
          <Box>
            <Icon color={colorDefs[color].text as any} {...iconProps} />
          </Box>
        ) : null}

        {text ? (
          <Text
            ml="2"
            mr="2"
            color={colorDefs[color].text as any}
            {...textProps}
          >
            {text}
          </Text>
        ) : null}
      </Box>
    )
  },
)
