import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import NFT from '@assets/images/nft.svg'
import Hotspot from '@assets/images/hotspot.svg'
import TabBar from '@components/TabBar'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import globalStyles from '@theme/globalStyles'
import { ReAnimatedBox } from '@components/AnimatedBox'
import AccountCollectablesList from './NftList'
import AccountHotspotsList from './HotspotList'

const CollectablesScreen = () => {
  const { t } = useTranslation()
  const [selectedItem, setSelectedItem] = useState('hotspots')
  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  const handleItemSelected = useCallback((item: string) => {
    setSelectedItem(item)
  }, [])

  const tabData = useMemo((): Array<{
    value: string
    title: string
    Icon: React.FC<SvgProps>
    iconPosition: 'top' | 'leading' | undefined
  }> => {
    return [
      {
        value: 'hotspots',
        title: t('collectablesScreen.hotspots.title'),
        Icon: Hotspot,
        iconPosition: 'leading',
      },
      {
        value: 'collectables',
        title: t('collectablesScreen.nfts.title'),
        Icon: NFT,
        iconPosition: 'leading',
      },
    ]
  }, [t])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Text marginTop="4" alignSelf="center" variant="textXlRegular">
          {t('collectablesScreen.title')}
        </Text>
        <TabBar
          marginTop="6"
          backgroundColor="base.black"
          tabBarOptions={tabData}
          selectedValue={selectedItem}
          onItemSelected={handleItemSelected}
          marginBottom="3"
        />

        {selectedItem === tabData[0].value && <AccountHotspotsList />}
        {selectedItem === tabData[1].value && <AccountCollectablesList />}
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default CollectablesScreen
