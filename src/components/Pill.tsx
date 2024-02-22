import Box from '@components/Box'
import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'
import Text from './Text'

type Color = 'blue' | 'green' | 'red' | 'orange'
export const Pill = memo(
  ({
    text,
    Icon,
    color,
  }: {
    text?: string
    color: Color
    Icon?: React.FC<SvgProps>
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
            <Icon width={22} height={22} color={colorDefs[color].text as any} />
          </Box>
        ) : null}

        {text ? (
          <Text ml="s" mr="s" color={colorDefs[color].text as any}>
            {text}
          </Text>
        ) : null}
      </Box>
    )
  },
)
