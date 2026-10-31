import type { LucideIcon, LucideProps } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { Text } from './Text'
import type { TextSize } from './textVariants'
import { twMerge } from './twMerge'

export type PillColor =
  | 'info'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'primary'
  | 'hnt'
  | 'iot'
  | 'mobile'

const pillColors: Record<
  PillColor,
  { container: string; text: string; icon: string }
> = {
  info: {
    container: 'border-blue-dark-500/30 bg-blue-dark-50',
    text: 'text-blue-dark-500',
    icon: 'accent-blue-dark-500',
  },
  success: {
    container: 'border-success-500/30 bg-success-50',
    text: 'text-success-500',
    icon: 'accent-success-500',
  },
  destructive: {
    container: 'border-destructive/30 bg-destructive/10',
    text: 'text-destructive',
    icon: 'accent-destructive',
  },
  warning: {
    container: 'border-warning-500/30 bg-warning-100',
    text: 'text-warning-500',
    icon: 'accent-warning-500',
  },
  primary: {
    container: 'border-primary bg-primary',
    text: 'text-primary-foreground',
    icon: 'accent-primary-foreground',
  },
  hnt: {
    container: 'border-hnt bg-hnt',
    text: 'text-white',
    icon: 'accent-white',
  },
  iot: {
    container: 'border-iot bg-iot',
    text: 'text-white',
    icon: 'accent-white',
  },
  mobile: {
    container: 'border-mobile bg-mobile',
    text: 'text-white',
    icon: 'accent-white',
  },
}

// One module-scope wrapper takes any lucide glyph and its colour class.
const PillIcon = withUniwind(
  ({ Icon, ...props }: LucideProps & { Icon: LucideIcon }) => (
    <Icon {...props} />
  ),
)

export type PillProps = {
  color: PillColor
  text?: string
  Icon?: LucideIcon
  iconSize?: number
  // Overrides the icon's colour (an `accent-` class), e.g. a status dot.
  iconColorClassName?: string
  textSize?: TextSize
}

// A rounded label with an optional leading lucide glyph.
export const Pill = ({
  color,
  text,
  Icon,
  iconSize = 16,
  iconColorClassName,
  textSize,
}: PillProps) => {
  const colors = pillColors[color]
  return (
    <View
      className={twMerge(
        'flex-row items-center rounded-full border p-1',
        colors.container,
      )}
    >
      {Icon ? (
        <PillIcon
          Icon={Icon}
          size={iconSize}
          colorClassName={iconColorClassName ?? colors.icon}
        />
      ) : null}
      {text ? (
        <Text size={textSize} className={twMerge('mx-2', colors.text)}>
          {text}
        </Text>
      ) : null}
    </View>
  )
}
