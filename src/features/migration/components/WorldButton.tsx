import ButtonPressable from '@components/ButtonPressable'
import React, { ComponentProps, FC } from 'react'

// The migration flow's pill button. Every variant shares one height so stacked
// actions line up. `primary` is the filled World-purple CTA, `secondary` a soft
// tinted CTA, `outline`/`dismiss` a bordered low-emphasis button, and `ghost` a
// borderless text button (used for "Not now"). Any ButtonPressable prop
// (color, height, spacing, LeadingComponent…) can be passed to override a
// default.
type Variant = 'primary' | 'secondary' | 'outline' | 'dismiss' | 'ghost'

type Color = ComponentProps<typeof ButtonPressable>['backgroundColor']

type Props = ComponentProps<typeof ButtonPressable> & {
  variant?: Variant
}

const HEIGHT = 56

const VARIANTS: Record<
  Variant,
  {
    // Omitted for `ghost` — a `transparent` backgroundColor would be run through
    // tinycolor().setAlpha(1) downstream and resolve to solid black, so ghost
    // must pass no backgroundColor at all to stay see-through.
    background?: Color
    titleColor: Color
    borderColor?: Color
    pressedOpacity?: number
    titleFades?: boolean
  }
> = {
  primary: {
    background: 'worldPurple',
    titleColor: 'white',
    pressedOpacity: 0.7,
  },
  secondary: {
    background: 'worldAccentBg',
    titleColor: 'worldPurple',
    pressedOpacity: 0.5,
    titleFades: true,
  },
  outline: {
    background: 'worldSurface',
    titleColor: 'worldInk',
    borderColor: 'worldBorder',
    pressedOpacity: 0.4,
    titleFades: true,
  },
  dismiss: {
    background: 'worldSurface',
    titleColor: 'worldSecondaryInk',
    borderColor: 'worldBorder',
    pressedOpacity: 0.4,
    titleFades: true,
  },
  ghost: {
    titleColor: 'worldPurple',
    pressedOpacity: 0,
    titleFades: true,
  },
}

const WorldButton: FC<Props> = ({ variant = 'primary', ...rest }) => {
  const v = VARIANTS[variant]
  return (
    <ButtonPressable
      width="100%"
      borderRadius="round"
      height={HEIGHT}
      backgroundColor={v.background}
      backgroundColorOpacityPressed={v.pressedOpacity}
      borderColor={v.borderColor}
      borderWidth={v.borderColor ? 1.5 : undefined}
      titleColorPressedOpacity={v.titleFades ? 0.3 : undefined}
      titleColor={v.titleColor}
      {...rest}
    />
  )
}

export default WorldButton
