import React from 'react'
import {
  type ButtonSize,
  type ButtonVariant,
  buttonClassName,
  buttonTextVariants,
} from './buttonVariants'
import { isTextLabel } from './isTextLabel'
import { PressableScale, type PressableScaleProps } from './PressableScale'
import { Text } from './Text'

export type ButtonProps = PressableScaleProps & {
  variant?: ButtonVariant
  size?: ButtonSize
}

// World's Button on the press primitive. A text child (strings and numbers)
// renders as the variant's label; other children render as given.
export const Button = ({
  variant,
  size,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <PressableScale
    accessibilityRole="button"
    {...props}
    disabled={disabled}
    className={buttonClassName({ variant, size, disabled }, className)}
  >
    {isTextLabel(children) ? (
      <Text className={buttonTextVariants({ variant })}>{children}</Text>
    ) : (
      children
    )}
  </PressableScale>
)
