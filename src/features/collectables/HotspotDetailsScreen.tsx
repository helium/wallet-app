import React, { useCallback, useMemo, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView, LogBox } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import { PublicKey } from '@solana/web3.js'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import SafeAreaBox from '../../components/SafeAreaBox'
import { DelayedFadeIn } from '../../components/FadeInOut'
import globalStyles from '../../theme/globalStyles'
import Box from '../../components/Box'
import ImageBox from '../../components/ImageBox'
import ButtonPressable from '../../components/ButtonPressable'
import Text from '../../components/Text'
import { ww } from '../../utils/layout'
import BackScreen from '../../components/BackScreen'
import { useSpacing } from '../../theme/themeHooks'
import Menu from '../../assets/images/menu.svg'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import BlurActionSheet from '../../components/BlurActionSheet'
import ListItem from '../../components/ListItem'
import InfoIcon from '../../assets/images/info.svg'
import { useHotspot } from '../../hooks/useHotspot'
import { ReAnimatedBox } from '../../components/AnimatedBox'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
])

type Route = RouteProp<CollectableStackParamList, 'HotspotDetailsScreen'>

const HotspotDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const COLLECTABLE_HEIGHT = ww
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [optionsOpen, setOptionsOpen] = useState(false)

  const { t } = useTranslation()

  const { collectable } = route.params
  const mint = useMemo(
    () => new PublicKey(collectable.mint.address),
    [collectable.mint],
  )

  const {
    pendingRewards,
    claimRewards,
    rewardsLoading: loading,
  } = useHotspot(mint)

  const hasMobileRewards = useMemo(
    () => pendingRewards && pendingRewards > 0,
    [pendingRewards],
  )

  const spacing = useSpacing()

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setOptionsOpen(open)
    },
    [],
  )

  const handleSend = useCallback(() => {
    setOptionsOpen(false)
    navigation.navigate('TransferCollectableScreen', {
      collectable,
    })
  }, [collectable, navigation])

  const handleClaimRewards = useCallback(() => {
    claimRewards()
  }, [claimRewards])

  const handleInfoPress = useCallback(() => {
    if (collectable.json) {
      navigation.push('NftMetadataScreen', {
        metadata: collectable.json,
      })
    }
  }, [collectable.json, navigation])

  const hotspotOptions = useCallback(
    () => (
      <>
        <ListItem
          key="transfer"
          title="Transfer"
          onPress={handleSend}
          selected={false}
        />
      </>
    ),
    [handleSend],
  )

  if (!collectable.json) {
    return null
  }

  return (
    <BackScreen
      padding="none"
      title={t('collectablesScreen.hotspots.hotspotDetailTitle')}
      backgroundImageUri={collectable.json.image || ''}
      edges={backEdges}
      TrailingIcon={InfoIcon}
      onTrailingIconPress={handleInfoPress}
    >
      <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
        <ScrollView>
          <SafeAreaBox
            edges={safeEdges}
            backgroundColor="transparent"
            flex={1}
            padding="m"
            alignItems="center"
          >
            {collectable.json && (
              <Box
                shadowColor="black"
                shadowOpacity={0.4}
                shadowOffset={{ width: 0, height: 10 }}
                shadowRadius={10}
                elevation={12}
              >
                <ImageBox
                  marginTop="l"
                  backgroundColor="black"
                  height={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  width={COLLECTABLE_HEIGHT - spacing.xl * 2}
                  source={{ uri: collectable.json.image, cache: 'force-cache' }}
                  borderRadius="xxl"
                />
              </Box>
            )}
            <Text
              marginTop="l"
              marginBottom="s"
              marginHorizontal="l"
              textAlign="center"
              variant="h1Medium"
            >
              {removeDashAndCapitalize(collectable.json.name || '')}
            </Text>
            <Text variant="body3Medium" color="grey600" marginBottom="xl">
              {collectable.json.description ||
                t('collectablesScreen.collectables.noDescription')}
            </Text>
            <Box
              flexDirection="row"
              marginBottom="xl"
              marginTop="m"
              marginHorizontal="xl"
            >
              <TouchableOpacityBox
                height={65}
                width={65}
                backgroundColor="transparent10"
                borderRadius="round"
                justifyContent="center"
                alignItems="center"
                marginEnd="s"
                onPress={toggleFiltersOpen(true)}
              >
                <Menu />
              </TouchableOpacityBox>
              <ButtonPressable
                height={65}
                flexGrow={1}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                titleColorDisabled="grey600"
                title={t('collectablesScreen.hotspots.claimRewards')}
                titleColor="black"
                disabled={loading || !hasMobileRewards}
                onPress={handleClaimRewards}
              />
            </Box>
            <Text marginBottom="s" variant="body2" color="grey600">
              {t('collectablesScreen.collectables.pendingRewardsTitle')}
            </Text>
            <Text variant="body2" marginBottom="m">
              {
                (t('collectablesScreen.collectables.pendingRewards'),
                {
                  amount: pendingRewards,
                  ticker: 'MOBILE',
                })
              }
            </Text>
            <BlurActionSheet
              title={t('collectablesScreen.hotspots.hotspotActions')}
              open={optionsOpen}
              onClose={toggleFiltersOpen(false)}
            >
              {hotspotOptions()}
            </BlurActionSheet>
          </SafeAreaBox>
        </ScrollView>
      </ReAnimatedBox>
    </BackScreen>
  )
}

export default HotspotDetailsScreen
