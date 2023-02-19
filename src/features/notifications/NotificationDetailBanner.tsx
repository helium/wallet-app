import React, { memo, useMemo } from 'react'
import { Image } from 'react-native'
import Box from '@components/Box'
import { useSpacing } from '@theme/themeHooks'
import { ww } from '../../utils/layout'

const NotificationDetailBanner = ({ icon }: { icon: string }) => {
  const spacing = useSpacing()
  const imageSrc = useMemo(() => {
    switch (icon) {
      default:
        return require('@assets/images/defaultBanner.png')
      case 'app-update':
        return require('@assets/images/appUpdateBanner.png')
      case 'app-outage':
        return require('@assets/images/appOutageBanner.png')
      case 'network-outage':
        return require('@assets/images/networkOutageBanner.png')
      case 'downtime':
        return require('@assets/images/downtimeBanner.png')
      case 'hip':
        return require('@assets/images/hipBanner.png')
      case 'vote':
        return require('@assets/images/voteBanner.png')
      case 'roadmap':
        return require('@assets/images/roadmapBanner.png')
    }
  }, [icon])

  if (!icon || icon === 'none') return null

  return (
    <Box justifyContent="center" alignItems="center">
      <Image
        source={imageSrc}
        resizeMode="contain"
        style={{ width: ww - spacing.m * 2 }}
      />
    </Box>
  )
}

export default memo(NotificationDetailBanner)
