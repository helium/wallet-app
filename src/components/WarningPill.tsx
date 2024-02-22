import Alert from '@assets/images/alert.svg'
import React, { memo } from 'react'
import { Pill } from './Pill'

export const WarningPill = memo(
  ({ text, variant }: { text: string; variant: 'critical' | 'critical' }) => {
    return (
      <Pill
        Icon={Alert}
        text={text}
        color={variant === 'critical' ? 'red' : 'orange'}
      />
    )
  },
)
