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

const PRESSED_OPACITY: Record<Variant, number | undefined> = {
  primary: 0.7,
  light: 0.7,
  secondary: undefined,
  dismiss: 0.05,
}

const BACKGROUND: Record<Variant, Color> = {
  primary: 'worldPurple',
  light: 'white',
  secondary: 'transparent',
  dismiss: 'transparent',
}

const TITLE_COLOR: Record<Variant, Color> = {
  primary: 'white',
  light: 'black',
  secondary: 'secondaryText',
  dismiss: 'secondaryText',
}

const WorldButton: FC<Props> = ({ variant = 'primary', ...rest }) => {
  const filled = variant === 'primary' || variant === 'light'
  const fades = variant === 'dismiss' || variant === 'light'
  return (
    <ButtonPressable
      width="100%"
      borderRadius="round"
      height={filled ? 60 : 48}
      backgroundColor={BACKGROUND[variant]}
      backgroundColorOpacityPressed={PRESSED_OPACITY[variant]}
      titleColorPressedOpacity={fades ? 0.3 : undefined}
      titleColor={TITLE_COLOR[variant]}
      {...rest}
    />
  )
}

export default WorldButton
