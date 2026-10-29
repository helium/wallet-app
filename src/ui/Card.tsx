import React from 'react'
import { View, type ViewProps } from 'react-native'
import { type CardVariant, cardVariants } from './cardVariants'

export type CardProps = ViewProps & {
  variant?: CardVariant
}

// World's card surface. Use it only where the layout already shows a card.
export const Card = ({ variant, className, ...props }: CardProps) => (
  <View
    {...props}
    className={`${cardVariants({ variant })} ${className ?? ''}`}
  />
)
