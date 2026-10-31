import { TriangleAlert } from 'lucide-react-native'
import React from 'react'
import { Pill } from './Pill'

export type WarningPillProps = {
  text: string
  variant: 'critical' | 'warning'
}

// A Pill with an alert glyph: red for critical, amber otherwise.
export const WarningPill = ({ text, variant }: WarningPillProps) => (
  <Pill
    Icon={TriangleAlert}
    text={text}
    color={variant === 'critical' ? 'destructive' : 'warning'}
  />
)
