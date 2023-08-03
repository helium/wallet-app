import expandedViewIcon from '@assets/images/expandedViewIcon.svg'
import listViewIcon from '@assets/images/listViewIcon.svg'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import ListItem from '@components/ListItem'
import TabBar from '@components/TabBar'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import useHaptic from '@hooks/useHaptic'
import useHotspots from '@hooks/useHotspots'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useColors } from '@theme/themeHooks'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { CompressedNFT, HotspotWithPendingRewards } from '../../types/solana'
import { formatLargeNumber } from '../../utils/accountUtils'
import HotspotCompressedListItem from './HotspotCompressedListItem'
import HotspotListItem from './HotspotListItem'
import { NFTSkeleton } from './NftListItem'
import { CollectableNavigationProp } from './collectablesTypes'

export const DEFAULT_PAGE_AMOUNT = 20

function RewardItem({
  mint,
  amount,
  marginStart,
  marginEnd,
}: {
  mint: PublicKey
  amount: BN | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marginStart?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marginEnd?: any
}) {
  const decimals = useMint(mint)?.info?.decimals
  const { json, symbol } = useMetaplexMetadata(mint)
  let realAmount = ''
  if (amount) {
    const num = toNumber(amount, decimals || 6)
    realAmount = formatLargeNumber(new BigNumber(num))
  }

  return (
    <Box
      padding="m"
      alignItems="center"
      justifyContent="center"
      backgroundColor="secondaryBackground"
      borderRadius="xl"
      flex={1}
      flexDirection="row"
      marginStart={marginStart}
      marginEnd={marginEnd}
    >
      <TokenIcon img={json?.image} size={30} />

      <Box marginStart="s">
        <Text
          marginTop="xs"
          variant="subtitle3"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.1}
        >
          {realAmount}
        </Text>
        <Text variant="subtitle4" color="secondaryText">
          {symbol}
        </Text>
      </Box>
    </Box>
  )
}

const HotspotList = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const { primaryText } = useColors()
  const { triggerImpact } = useHaptic()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [pageAmount, setPageAmount] = useState<number | undefined>(
    DEFAULT_PAGE_AMOUNT,
  )

  const tabBarOptions = useMemo(
    () => [
      {
        value: 'list',
        Icon: listViewIcon,
        iconSize: 32,
        IconPosition: 'top',
      },
      {
        value: 'expanded',
        Icon: expandedViewIcon,
        iconSize: 32,
        IconPosition: 'top',
      },
    ],
    [],
  )

  const [tabSelected, setTabSelected] = useState(tabBarOptions[0].value)

  const {
    hotspots,
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    fetchMore,
    fetchingMore,
    pendingIotRewards,
    pendingMobileRewards,
    onEndReached,
  } = useHotspots()

  const handleNavigateToCollectable = useCallback(
    (collectable: HotspotWithPendingRewards) => {
      if (collectable.content.metadata) {
        triggerImpact('light')
        navigation.navigate('HotspotDetailsScreen', { collectable })
      }
    },
    [navigation, triggerImpact],
  )

  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused && !onEndReached) {
      fetchMore(pageAmount)
    }
  }, [fetchingMore, isFocused, fetchMore, pageAmount, onEndReached])

  const handleNavigateToClaimRewards = useCallback(() => {
    navigation.navigate('ClaimAllRewardsScreen')
  }, [navigation])

  const toggleFiltersOpen = useCallback(
    (open) => () => {
      setFiltersOpen(open)
    },
    [],
  )

  const handleSetPageAmount = useCallback(
    (amount?: number) => () => {
      setFiltersOpen(false)
      setPageAmount(amount)
      refresh(amount)
    },
    [setPageAmount, setFiltersOpen, refresh],
  )

  const filters = useCallback(
    () => (
      <>
        <ListItem
          key="show-20"
          title={t('collectablesScreen.hotspots.twenty')}
          selected={pageAmount === DEFAULT_PAGE_AMOUNT}
          onPress={handleSetPageAmount(DEFAULT_PAGE_AMOUNT)}
          hasPressedState={false}
        />
        <ListItem
          key="show-50"
          title={t('collectablesScreen.hotspots.fifty')}
          onPress={handleSetPageAmount(50)}
          selected={pageAmount === 50}
          hasPressedState={false}
        />
        <ListItem
          key="show-all"
          title={t('collectablesScreen.hotspots.all')}
          subtitle={t('collectablesScreen.hotspots.showAllHotspotsWarning')}
          // Set an unrealistically high amount
          onPress={handleSetPageAmount(10000)}
          selected={pageAmount === 10000}
          hasPressedState={false}
          subtitleColor="orange500"
        />
      </>
    ),
    [handleSetPageAmount, pageAmount, t],
  )

  const onTabSelected = useCallback(
    (value) => {
      setTabSelected(value)
    },
    [setTabSelected],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box marginHorizontal="l" marginTop="l">
        <Box flex={1} marginBottom="l">
          <TabBar
            marginStart="s"
            flex={1}
            tabBarOptions={tabBarOptions}
            onItemSelected={onTabSelected}
            selectedValue={tabSelected}
            hasIndicator={false}
            hasDivider={false}
          />

          <TouchableOpacityBox
            onPress={toggleFiltersOpen(true)}
            position="absolute"
            top={0}
            bottom={0}
            right={0}
            justifyContent="center"
            marginTop="s"
            marginEnd="m"
          >
            <Text variant="subtitle3" color="secondaryText" textAlign="right">
              {t('collectablesScreen.hotspots.filter')}
            </Text>
          </TouchableOpacityBox>
        </Box>
        <Box />
        <Box flexDirection="row">
          <RewardItem
            mint={MOBILE_MINT}
            amount={pendingMobileRewards}
            marginEnd="s"
          />
          <RewardItem
            mint={IOT_MINT}
            amount={pendingIotRewards}
            marginStart="s"
          />
        </Box>
        {pageAmount && hotspotsWithMeta?.length >= pageAmount && (
          <Text
            marginTop="m"
            variant="subtitle4"
            color="orange500"
            textAlign="center"
          >
            {t('collectablesScreen.hotspots.currentDisplayedRewards')}
          </Text>
        )}
        <ButtonPressable
          flexGrow={1}
          marginTop="l"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="secondaryText"
          title={t('collectablesScreen.hotspots.claimAllRewards')}
          titleColor="black"
          marginBottom="m"
          disabled={
            (pendingIotRewards &&
              pendingIotRewards.eq(new BN('0')) &&
              pendingMobileRewards &&
              pendingMobileRewards.eq(new BN('0'))) ||
            hotspotsWithMeta?.length === 0
          }
          onPress={handleNavigateToClaimRewards}
        />
      </Box>
    )
  }, [
    handleNavigateToClaimRewards,
    pendingIotRewards,
    pendingMobileRewards,
    t,
    onTabSelected,
    tabSelected,
    tabBarOptions,
    toggleFiltersOpen,
    hotspotsWithMeta,
    pageAmount,
  ])

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotWithPendingRewards }) => {
      if (tabSelected === 'list') {
        return (
          <HotspotCompressedListItem
            hotspot={item}
            onPress={handleNavigateToCollectable}
            key={item.id}
            marginBottom="xs"
          />
        )
      }
      return (
        <HotspotListItem
          hotspot={item}
          onPress={handleNavigateToCollectable}
          key={item.id}
        />
      )
    },
    [handleNavigateToCollectable, tabSelected],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!loadingHotspots) return null

    if (loadingHotspots && hotspots) {
      return (
        <Box flex={1} flexDirection="row">
          {times(hotspots.length).map((i) => (
            <NFTSkeleton key={i} />
          ))}
        </Box>
      )
    }

    return null
  }, [hotspots, loadingHotspots])

  const keyExtractor = useCallback((item: CompressedNFT) => {
    return item.id
  }, [])

  const Footer = useCallback(
    () => (
      <Box marginTop="m" marginBottom="s">
        {fetchingMore ? <CircleLoader loaderSize={40} /> : <Box height={40} />}
      </Box>
    ),
    [fetchingMore],
  )

  const handleRefresh = useCallback(() => {
    refresh(pageAmount)
  }, [pageAmount, refresh])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refresh()
    })
  }, [navigation, refresh])

  return (
    <>
      <FlatList
        data={hotspotsWithMeta}
        numColumns={2}
        columnWrapperStyle={{
          flexDirection: tabSelected === 'list' ? 'column' : 'row',
        }}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loadingHotspots}
            onRefresh={handleRefresh}
            title=""
            tintColor={primaryText}
          />
        }
        renderItem={renderCollectable}
        ListEmptyComponent={renderEmptyComponent}
        onEndReachedThreshold={0.001}
        onEndReached={handleOnEndReached}
        keyExtractor={keyExtractor}
        ListFooterComponent={Footer}
      />
      <BlurActionSheet
        title={t('collectablesScreen.hotspots.chooseAmountOfHotspots')}
        open={filtersOpen}
        onClose={toggleFiltersOpen(false)}
      >
        {filters()}
      </BlurActionSheet>
    </>
  )
}

export default HotspotList
