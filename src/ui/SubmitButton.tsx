import { Hand } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import SwipeButton from 'rn-swipe-button'
import { useResolveClassNames } from 'uniwind'
import { twMerge } from './twMerge'

// The swipe colour: title, thumb border and glyph.
const colorClassNames = {
  'blue-dark-500': 'text-blue-dark-500',
  destructive: 'text-destructive',
}

// The rail and thumb fill.
const backgroundClassNames = {
  'muted-foreground': 'bg-muted-foreground',
  background: 'bg-background',
}

export type SubmitButtonProps = {
  onSubmit?: () => void
  title: string
  disabled?: boolean
  color?: keyof typeof colorClassNames
  backgroundColor?: keyof typeof backgroundClassNames
  className?: string
}

// A swipe-to-submit rail. The swipe calls onSubmit, then the thumb resets.
export const SubmitButton = ({
  color = 'blue-dark-500',
  onSubmit,
  title,
  disabled = false,
  backgroundColor = 'muted-foreground',
  className,
}: SubmitButtonProps) => {
  // The swipe button takes colour values, not classes.
  const colorActual = useResolveClassNames(colorClassNames[color]).color as
    string | undefined
  const backgroundActual = useResolveClassNames(
    backgroundClassNames[backgroundColor],
  ).backgroundColor as string | undefined
  const secondary = useResolveClassNames('bg-secondary').backgroundColor as
    string | undefined
  const mutedForeground = useResolveClassNames('text-muted-foreground')
    .color as string | undefined
  const titleFont = useResolveClassNames('font-normal')

  const railStyles = {
    backgroundColor: secondary,
    borderColor: secondary,
    paddingLeft: 8,
  }
  const titleStyles = {
    fontFamily: titleFont.fontFamily,
    color: disabled ? mutedForeground : colorActual,
    fontSize: 19,
    paddingLeft: 30,
  }

  const thumbIcon = () => (
    <View testID="SubmitButton.Thumb">
      <Hand color={colorActual} />
    </View>
  )

  return (
    <View
      className={twMerge(
        'rounded-full',
        backgroundClassNames[backgroundColor],
        className,
      )}
    >
      <SwipeButton
        shouldResetAfterSuccess
        railBackgroundColor={backgroundActual}
        railStyles={railStyles}
        railBorderColor={backgroundActual}
        titleStyles={titleStyles}
        titleMaxFontScale={1}
        thumbIconBackgroundColor={backgroundActual}
        thumbIconBorderColor={colorActual}
        title={title || ''}
        onSwipeSuccess={onSubmit}
        thumbIconComponent={thumbIcon}
        disableResetOnTap
        disabled={disabled}
        disabledRailBackgroundColor={secondary}
        disabledThumbIconBackgroundColor={secondary}
        disabledThumbIconBorderColor={mutedForeground}
      />
    </View>
  )
}
