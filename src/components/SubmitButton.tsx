import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import SwipeButton from 'rn-swipe-button'
import SwipeIcon from '@assets/images/swipeIcon.svg'
import { Font, Theme } from '@theme/theme'
import { useColors } from '@theme/themeHooks'
import Box from './Box'

type Props = {
  onSubmit?: () => void
  title: string
  disabled?: boolean
  color?: string
  backgroundColor?: string
} & BoxProps<Theme>

const SubmitButton = ({
  color = 'blue.light-500',
  onSubmit,
  title,
  disabled = false,
  backgroundColor = 'secondaryText',
  ...boxProps
}: Props) => {
  const { secondaryText, ...rest } = useColors()
  const colorActual = rest[color as keyof typeof rest]
  const backgroundActual = rest[backgroundColor as keyof typeof rest]
  const icon = useMemo(
    () => () => <SwipeIcon color={colorActual} />,
    [colorActual],
  )

  const styles = useMemo(
    () => ({
      titleStyles: {
        fontFamily: Font.regular,
        color: disabled ? secondaryText : colorActual,
        fontSize: 19,
        paddingLeft: 30,
      },
      railStyles: {
        backgroundColor: rest['bg.tertiary'],
        borderColor: rest['bg.tertiary'],
        paddingLeft: 8,
      },
    }),
    [colorActual, disabled, secondaryText, rest],
  )

  return (
    <Box
      backgroundColor={backgroundColor as any}
      borderRadius="full"
      {...boxProps}
    >
      <SwipeButton
        shouldResetAfterSuccess
        railBackgroundColor={backgroundActual}
        railStyles={styles.railStyles}
        railBorderColor={backgroundActual}
        titleStyles={styles.titleStyles}
        titleMaxFontScale={1}
        thumbIconBackgroundColor={backgroundActual}
        thumbIconBorderColor={colorActual}
        title={title}
        onSwipeSuccess={onSubmit}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        thumbIconComponent={icon}
        disableResetOnTap
        disabled={disabled}
        disabledRailBackgroundColor={rest['bg.tertiary']}
        disabledThumbIconBackgroundColor={rest['bg.tertiary']}
        disabledThumbIconBorderColor={secondaryText}
      />
    </Box>
  )
}

export default memo(SubmitButton)
