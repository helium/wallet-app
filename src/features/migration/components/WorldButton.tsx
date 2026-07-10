import ButtonPressable from '@components/ButtonPressable'
import React, { ComponentProps, FC } from 'react'

// The migration flow's pill button. `primary` is the filled World-purple CTA,
// `secondary` the transparent text button, `dismiss` a secondary that fades on
// press (used for the low-emphasis dismiss action). Any ButtonPressable prop
// (color, height, spacing, LeadingComponent…) can be passed to override a default.
type Props = ComponentProps<typeof ButtonPressable> & {
  variant?: 'primary' | 'secondary' | 'dismiss'
}

const PRESSED_OPACITY: Record<
  NonNullable<Props['variant']>,
  number | undefined
> = {
  primary: 0.7,
  secondary: undefined,
  dismiss: 0.05,
}

const WorldButton: FC<Props> = ({ variant = 'primary', ...rest }) => (
  <ButtonPressable
    width="100%"
    borderRadius="round"
    height={variant === 'primary' ? 60 : 48}
    backgroundColor={variant === 'primary' ? 'worldPurple' : 'transparent'}
    backgroundColorOpacityPressed={PRESSED_OPACITY[variant]}
    titleColorPressedOpacity={variant === 'dismiss' ? 0.3 : undefined}
    titleColor={variant === 'primary' ? 'white' : 'secondaryText'}
    {...rest}
  />
)

export default WorldButton
