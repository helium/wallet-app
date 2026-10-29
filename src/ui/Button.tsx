import React from 'react'
import {
  type ButtonSize,
  type ButtonVariant,
  buttonTextVariants,
  buttonVariants,
} from './buttonVariants'
import { PressableScale, type PressableScaleProps } from './PressableScale'
import { Text } from './Text'

export type ButtonProps = PressableScaleProps & {
  variant?: ButtonVariant
  size?: ButtonSize
}

// World's Button on the press primitive. A string child renders as the
// variant's label; other children render as given.
export const Button = ({
  variant,
  size,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <PressableScale
    {...props}
    disabled={disabled}
    className={`${buttonVariants({ variant, size, disabled })} ${className ?? ''}`}
  >
    {typeof children === 'string' ? (
      <Text className={buttonTextVariants({ variant })}>{children}</Text>
    ) : (
      children
    )}
  </PressableScale>
)
