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
        text: 'blue500',
      },
      green: {
        border: 'greenBorder',
        background: 'green950',
        text: 'green500',
      },
      red: {
        border: 'redBorder',
        background: 'matchaRed950',
        text: 'matchaRed500',
      },
      orange: {
        border: 'orangeBorder',
        background: 'orange950',
        text: 'orange500',
      },
      black: {
        background: 'black',
        text: 'white',
        border: 'black',
      },
      hntBlue: {
        background: 'hntBlue',
        text: 'white',
        border: 'black',
      },
      iotGreen: {
        background: 'iotGreen',
        text: 'white',
        border: 'black',
      },
      mobileBlue: {
        background: 'mobileBlue',
        text: 'white',
        border: 'black',
      },
    }
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        borderRadius="xxl"
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
            ml="s"
            mr="s"
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
