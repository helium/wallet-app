import ButtonPressable from '@components/ButtonPressable'
import React, { ComponentProps, FC } from 'react'

// The migration flow's pill button. `primary` is the filled World-purple CTA,
// `light` the filled white CTA, `secondary` the transparent text button,
// `dismiss` a secondary that fades on press (used for the low-emphasis dismiss
// action). Any ButtonPressable prop (color, height, spacing, LeadingComponent…)
// can be passed to override a default.
type Variant = 'primary' | 'light' | 'secondary' | 'dismiss'

type Props = ComponentProps<typeof ButtonPressable> & {
  variant?: Variant
}

type Color = ComponentProps<typeof ButtonPressable>['backgroundColor']

const VARIANTS: Record<
  Variant,
  {
    background: Color
    titleColor: Color
    height: number
    pressedOpacity?: number
    titleFades?: boolean
  }
> = {
  primary: {
    background: 'worldPurple',
    titleColor: 'white',
    height: 60,
    pressedOpacity: 0.7,
  },
  light: {
    background: 'white',
    titleColor: 'black',
    height: 60,
    pressedOpacity: 0.7,
    titleFades: true,
  },
  secondary: {
    background: 'transparent',
    titleColor: 'secondaryText',
    height: 48,
  },
  dismiss: {
    background: 'transparent',
    titleColor: 'secondaryText',
    height: 48,
    pressedOpacity: 0.05,
    titleFades: true,
  },
}

const WorldButton: FC<Props> = ({ variant = 'primary', ...rest }) => {
  const v = VARIANTS[variant]
  return (
    <ButtonPressable
      width="100%"
      borderRadius="round"
      height={v.height}
      backgroundColor={v.background}
      backgroundColorOpacityPressed={v.pressedOpacity}
      titleColorPressedOpacity={v.titleFades ? 0.3 : undefined}
      titleColor={v.titleColor}
      {...rest}
    />
  )
}

export default WorldButton
