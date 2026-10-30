import React from 'react'
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native'

export type SpinnerProps = ActivityIndicatorProps & {
  colorClassName?: string
}

// World's loading indicator on React Native ActivityIndicator. World purple by
// default; pass an `accent-` class in `colorClassName` to change the colour.
export const Spinner = ({
  colorClassName = 'accent-purple-700',
  ...props
}: SpinnerProps) => (
  <ActivityIndicator colorClassName={colorClassName} {...props} />
)
