import React, { memo } from 'react'
import NotificationBell from '@assets/images/notificationBell.svg'
import Box from './Box'
import { useColors } from '../theme/themeHooks'

const NotificationIcon = () => {
  const { primaryIcon } = useColors()
  return (
    <Box>
      <NotificationBell color={primaryIcon} />
    </Box>
  )
}

export default memo(NotificationIcon)
