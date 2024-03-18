import React, { useEffect } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import {
  ReAnimatedBox,
  DelayedFadeIn,
  BackScreen,
  SafeAreaBox,
  Map,
} from '@components'
import useHotspots from '@hooks/useHotspots'
import { on } from 'events'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'HotspotMapScreen'>

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { hotspot } = route.params || {}
  const navigation = useNavigation<CollectableNavigationProp>()
  const [safeEdges, backEdges] = [['bottom'], ['top']] as Edge[][]
  const { hotspots, fetchMore, fetchingMore, loading, onEndReached } =
    useHotspots()

  useEffect(() => {
    if (!loading && !fetchingMore && !onEndReached) {
      fetchMore(100)
    }
  }, [loading, fetchingMore, fetchMore, onEndReached])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      {/* <BackScreen edges={backEdges} title={t('hotspotMap.title')}> */}
      <SafeAreaBox edges={safeEdges} flex={1}>
        {!loading && !fetchingMore && onEndReached && <Map />}
      </SafeAreaBox>
      {/* </BackScreen> */}
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
