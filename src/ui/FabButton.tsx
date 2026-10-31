import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ChevronRight,
  Droplet,
  Ellipsis,
} from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { PressableScale, type PressableScaleProps } from './PressableScale'
import { Text } from './Text'
import { twMerge } from './twMerge'

const ICONS = {
  arrowRight: withUniwind(ChevronRight),
  fatArrowUp: withUniwind(ArrowUp),
  fatArrowDown: withUniwind(ArrowDown),
  swaps: withUniwind(ArrowLeftRight),
  airdrop: withUniwind(Droplet),
  dots: withUniwind(Ellipsis),
}

const TONES = {
  success: {
    background: 'bg-success-500/20',
    icon: 'accent-success-500',
    text: 'text-success-500',
  },
  warning: {
    background: 'bg-warning-500/20',
    icon: 'accent-warning-500',
    text: 'text-warning-500',
  },
  accent: {
    background: 'bg-purple-500/20',
    icon: 'accent-purple-500',
    text: 'text-purple-500',
  },
  info: {
    background: 'bg-blue-dark-500/20',
    icon: 'accent-blue-dark-500',
    text: 'text-blue-dark-500',
  },
  primary: {
    background: 'bg-primary',
    icon: 'accent-primary-foreground',
    text: 'text-primary-foreground',
  },
}

export type FabIcon = keyof typeof ICONS
export type FabTone = keyof typeof TONES

export type FabButtonProps = Omit<PressableScaleProps, 'children'> & {
  tone: FabTone
  icon?: FabIcon
  // a pill with the title beside the glyph in place of the round button
  title?: string
  // puts the glyph after the title
  reverse?: boolean
}

// A round action button with a glyph, or a pill when it has a title. A round
// button with no icon shows dots.
export const FabButton = ({
  tone,
  icon,
  title,
  reverse,
  className,
  ...props
}: FabButtonProps) => {
  const colors = TONES[tone]

  if (title) {
    const Icon = icon && ICONS[icon]
    return (
      <PressableScale
        {...props}
        className={twMerge(
          'mx-2 h-14 flex-row items-center justify-center rounded-full px-4',
          reverse && 'flex-row-reverse',
          colors.background,
          className,
        )}
      >
        {Icon && (
          <View className="px-1">
            <Icon size={24} colorClassName={colors.icon} />
          </View>
        )}
        <Text
          size="lg"
          className={twMerge('px-1 font-medium', colors.text)}
          maxFontSizeMultiplier={1.1}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </PressableScale>
    )
  }

  const Icon = ICONS[icon ?? 'dots']
  return (
    <PressableScale
      {...props}
      className={twMerge(
        'size-14 items-center justify-center rounded-full',
        colors.background,
        className,
      )}
    >
      <Icon size={24} colorClassName={colors.icon} />
    </PressableScale>
  )
}
