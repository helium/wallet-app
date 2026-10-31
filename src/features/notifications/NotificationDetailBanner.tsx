import React from 'react'
import { Image, View } from 'react-native'
import { useContentWidth } from '../../utils/layout'

const bannerSource = (icon: string) => {
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
}

// 16pt (`m`) of margin on each side of the content column.
const BANNER_MARGIN = 16

const NotificationDetailBanner = ({ icon }: { icon: string }) => {
  const contentWidth = useContentWidth()

  if (!icon || icon === 'none') return null

  return (
    <View className="items-center justify-center">
      <Image
        source={bannerSource(icon)}
        resizeMode="contain"
        style={{ width: contentWidth - BANNER_MARGIN * 2 }}
      />
    </View>
  )
}

export default NotificationDetailBanner
