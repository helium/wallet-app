import Box from '@components/Box'
import { TextProps } from '@shopify/restyle'
import { Theme } from '@config/theme/theme'
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
  | 'quinary'
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
        border: 'blue.300',
        background: 'blue.950',
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
        text: 'error.500',
      },
      orange: {
        border: 'orange.300',
        background: 'orange.950',
        text: 'orange.500',
      },
      black: {
        background: 'base.black',
        text: 'base.white',
        border: 'base.black',
      },
      hntBlue: {
        background: 'purple.500',
        text: 'base.white',
        border: 'purple.500',
      },
      iotGreen: {
        background: 'iotGreen',
        text: 'base.white',
        border: 'iotGreen',
      },
      mobileBlue: {
        background: 'blue.600',
        text: 'base.white',
        border: 'blue.600',
      },
      quinary: {
        background: 'fg.quinary-400',
        text: 'primaryBackground',
        border: 'fg.quinary-400',
      },
    }
    return (
      <Box
        flexDirection="row"
        alignItems="center"
        borderRadius="4xl"
        paddingHorizontal="2.5"
        paddingVertical="1"
        borderWidth={2}
        borderColor={colorDefs[color].border as any}
        backgroundColor={colorDefs[color].background as any}
      >
        {Icon ? (
          <Box>
            <Icon
              color={colorDefs[color].text as any}
              width={20}
              {...iconProps}
            />
          </Box>
        ) : null}

        {text ? (
          <Text
            ml="2"
            mr="2"
            color={colorDefs[color].text as any}
            {...textProps}
            variant="textSmSemibold"
          >
            {text}
          </Text>
        ) : null}
      </Box>
    )
  },
)
