import React, { useCallback, useMemo, useState } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import BN from 'bn.js'
import listViewIcon from '@assets/images/listViewIcon.svg'
import expandedViewIcon from '@assets/images/expandedViewIcon.svg'
import { Balance } from '@helium/currency'
import ListItem from '@components/ListItem'
import BlurActionSheet from '@components/BlurActionSheet'
import { useColors } from '@theme/themeHooks'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import useHotspots from '@hooks/useHotspots'
import CircleLoader from '@components/CircleLoader'
import useHaptic from '@hooks/useHaptic'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TabBar from '@components/TabBar'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { formatLargeNumber } from '../../utils/accountUtils'
import HotspotCompressedListItem from './HotspotCompressedListItem'
import HotspotListItem from './HotspotListItem'
import { CollectableNavigationProp } from './collectablesTypes'
import { CompressedNFT } from '../../types/solana'
import { NFTSkeleton } from './NftListItem'
import { HotspotWithPendingRewards } from '../../utils/solanaUtils'

const DEFAULT_PAGE_AMOUNT = 20

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
      },
      {
        value: 'expanded',
        Icon: expandedViewIcon,
        iconSize: 32,
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
    createHotspot,
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
          onPress={handleSetPageAmount(undefined)}
          selected={pageAmount === undefined}
          hasPressedState={false}
          subtitleColor="orange500"
        />
      </>
    ),
    [handleSetPageAmount, pageAmount, t],
  )

  const RewardItem = useCallback(({ ticker, amount, ...rest }) => {
    const realAmount = Balance.fromIntAndTicker(amount, ticker)
    return (
      <Box
        padding="m"
        alignItems="center"
        justifyContent="center"
        backgroundColor="secondaryBackground"
        borderRadius="xl"
        flex={1}
        flexDirection="row"
        {...rest}
      >
        <TokenIcon ticker={ticker} size={30} />

        <Box marginStart="s">
          <Text
            marginTop="xs"
            variant="subtitle3"
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.1}
          >
            {formatLargeNumber(realAmount.bigBalance as unknown as BN)}
          </Text>
          <Text variant="subtitle4" color="secondaryText">
            {ticker}
          </Text>
        </Box>
      </Box>
    )
  }, [])

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
            ticker="MOBILE"
            amount={pendingMobileRewards}
            marginEnd="s"
          />
          <RewardItem ticker="IOT" amount={pendingIotRewards} marginStart="s" />
        </Box>
        {pageAmount && hotspotsWithMeta.length > pageAmount && (
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
            pendingIotRewards &&
            pendingIotRewards.eq(new BN('0')) &&
            pendingMobileRewards &&
            pendingMobileRewards.eq(new BN('0'))
          }
          onPress={handleNavigateToClaimRewards}
        />
        {__DEV__ && (
          <ButtonPressable
            flexGrow={1}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            title="Create Hotspot"
            titleColor="black"
            marginBottom="m"
            onPress={createHotspot}
          />
        )}
      </Box>
    )
  }, [
    createHotspot,
    handleNavigateToClaimRewards,
    pendingIotRewards,
    pendingMobileRewards,
    RewardItem,
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
