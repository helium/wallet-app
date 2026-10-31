import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import HotspotSvg from '@assets/images/hotspot.svg'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { Image as ImageGlyph } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import AccountCollectablesList from './NftList'
import AccountHotspotsList from './HotspotList'

const SafeArea = withUniwind(SafeAreaView)
const HotspotIcon = withUniwind(HotspotSvg)
const NftIcon = withUniwind(ImageGlyph)

const EDGES = ['top'] as const

type TabValue = 'hotspots' | 'collectables'

const CollectablesScreen = () => {
  const { t } = useTranslation()
  const [selectedItem, setSelectedItem] = useState<TabValue>('hotspots')

  const tabs = [
    {
      value: 'hotspots' as const,
      title: t('collectablesScreen.hotspots.title'),
      Icon: HotspotIcon,
    },
    {
      value: 'collectables' as const,
      title: t('collectablesScreen.nfts.title'),
      Icon: NftIcon,
    },
  ]

  return (
    <Animated.View className="flex-1 bg-background">
      <SafeArea edges={EDGES} className="flex-1">
        <Text size="xl" className="mt-4 self-center font-medium">
          {t('collectablesScreen.title')}
        </Text>
        <View className="mb-3 mt-6 flex-row border-b border-border">
          {tabs.map(({ value, title, Icon }) => {
            const selected = selectedItem === value
            return (
              <PressableScale
                key={value}
                feedback="opacity"
                accessibilityState={{ selected }}
                onPress={() => setSelectedItem(value)}
                className={twMerge(
                  'flex-1 flex-row items-center justify-center gap-2 border-b-[3px] border-transparent py-3',
                  selected && 'border-foreground',
                )}
              >
                <Icon
                  colorClassName={
                    selected ? 'accent-foreground' : 'accent-muted-foreground'
                  }
                />
                <Text
                  size="base"
                  className={twMerge(
                    'font-medium',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {title}
                </Text>
              </PressableScale>
            )
          })}
        </View>

        {selectedItem === 'hotspots' && <AccountHotspotsList />}
        {selectedItem === 'collectables' && <AccountCollectablesList />}
      </SafeArea>
    </Animated.View>
  )
}

export default CollectablesScreen
