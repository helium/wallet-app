import ButtonPressable from '@components/ButtonPressable'
import React, { ComponentProps, FC } from 'react'

// The migration flow's pill button. `primary` is the filled World-purple CTA,
// `secondary` the transparent text button. Any ButtonPressable prop (color,
// height, spacing, LeadingComponent…) can be passed to override a default.
type Props = ComponentProps<typeof ButtonPressable> & {
  variant?: 'primary' | 'secondary'
}

const WorldButton: FC<Props> = ({ variant = 'primary', ...rest }) => (
  <ButtonPressable
    width="100%"
    borderRadius="round"
    height={variant === 'primary' ? 60 : 48}
    backgroundColor={variant === 'primary' ? 'worldPurple' : 'transparent'}
    backgroundColorOpacityPressed={variant === 'primary' ? 0.7 : undefined}
    titleColor={variant === 'primary' ? 'white' : 'secondaryText'}
    {...rest}
  />
)

export default WorldButton
