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
} & BoxProps<Theme>
const SubmitButton = ({ onSubmit, title, disabled, ...boxProps }: Props) => {
  const { surfaceSecondary, secondaryText, blueBright500, secondaryIcon } =
    useColors()
  const icon = useMemo(
    () => () => <SwipeIcon color={blueBright500} />,
    [blueBright500],
  )

  const styles = useMemo(
    () => ({
      titleStyles: {
        fontFamily: Font.regular,
        color: disabled ? secondaryText : blueBright500,
        fontSize: 19,
      },
      railStyles: {
        backgroundColor: surfaceSecondary,
        borderColor: surfaceSecondary,
      },
    }),

    [blueBright500, disabled, secondaryText, surfaceSecondary],
  )

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Box backgroundColor="secondaryIcon" borderRadius="round" {...boxProps}>
      <SwipeButton
        shouldResetAfterSuccess
        railBackgroundColor={secondaryIcon}
        railStyles={styles.railStyles}
        railBorderColor={secondaryIcon}
        titleStyles={styles.titleStyles}
        titleMaxFontScale={1}
        thumbIconBackgroundColor={secondaryIcon}
        thumbIconBorderColor={blueBright500}
        title={title}
        onSwipeSuccess={onSubmit}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        thumbIconComponent={icon}
        disableResetOnTap
        disabled={disabled}
        disabledRailBackgroundColor={surfaceSecondary}
        disabledThumbIconBackgroundColor={surfaceSecondary}
        disabledThumbIconBorderColor={secondaryText}
      />
    </Box>
  )
}

export default memo(SubmitButton)
