import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import SwipeButton from 'rn-swipe-button'
import SwipeIcon from '@assets/images/swipeIcon.svg'
import { Font, Theme } from '../theme/theme'
import { useColors } from '../theme/themeHooks'
import Box from './Box'

type Props = {
  onSubmit?: () => void
  title: string
  disabled?: boolean
} & BoxProps<Theme>
const SubmitButton = ({ onSubmit, title, disabled, ...boxProps }: Props) => {
  const { surfaceSecondary, primaryText, secondaryText } = useColors()
  const icon = useMemo(
    () => () => <SwipeIcon color={secondaryText} />,
    [secondaryText],
  )

  const styles = useMemo(
    () => ({
      titleStyles: {
        fontFamily: Font.regular,
        color: disabled ? secondaryText : primaryText,
        fontSize: 19,
      },
      railStyles: {
        backgroundColor: surfaceSecondary,
        borderColor: surfaceSecondary,
      },
    }),

    [disabled, primaryText, secondaryText, surfaceSecondary],
  )

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Box backgroundColor="surfaceSecondary" borderRadius="round" {...boxProps}>
      <SwipeButton
        railBackgroundColor={surfaceSecondary}
        railStyles={styles.railStyles}
        railBorderColor={surfaceSecondary}
        titleStyles={styles.titleStyles}
        titleMaxFontScale={1}
        thumbIconBackgroundColor={disabled ? secondaryText : primaryText}
        thumbIconBorderColor={secondaryText}
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
