import React, { useCallback, useMemo } from 'react'
import { Image, RefreshControl, SectionList } from 'react-native'
import { EnrichedTransaction } from 'src/types/solana'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '@components/Box'
import Text from '@components/Text'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import CircleLoader from '@components/CircleLoader'
import FadeInOut from '@components/FadeInOut'
import useHaptic from '@hooks/useHaptic'
import { useColors, useSpacing } from '@theme/themeHooks'
import { NavBarHeight } from '@components/ServiceNavBar'
import ScrollBox from '@components/ScrollBox'
import { ActivityNavigationProp } from './activityTypes'
import ActivityListItem from './ActivityListItem'

const ActivityScreen = () => {
  const { transactions, loading, fetchingMore, refresh } =
    useEnrichedTransactions()
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()
  const colors = useColors()
  const navigation = useNavigation<ActivityNavigationProp>()
  const { triggerImpact } = useHaptic()

  const contentContainer = useMemo(
    () => ({
      paddingTop: spacing['6xl'],
      paddingBottom: NavBarHeight + bottom + spacing['6xl'],
    }),
    [spacing, bottom],
  )

  const SectionData = useMemo((): {
    title: string
    data: (EnrichedTransaction | ConfirmedSignatureInfo)[]
  }[] => {
    // Group by date
    const grouped = transactions.reduce((acc, tx) => {
      const enrichedTx = tx as EnrichedTransaction
      const confirmedSig = tx as ConfirmedSignatureInfo

      const date = new Date()

      if (enrichedTx.timestamp) {
        date.setTime(enrichedTx.timestamp * 1000)
      }

      if (confirmedSig.blockTime) {
        date.setTime(confirmedSig.blockTime * 1000)
      }

      const key = date.toDateString()
      if (!acc[key]) {
        acc[key] = []
      }

      if (!tx) return acc

      acc[key].push(tx)
      return acc
    }, {} as Record<string, (EnrichedTransaction | ConfirmedSignatureInfo)[]>)

    // Create array of objects
    const sections = Object.keys(grouped).map((date) => {
      return {
        title: date,
        data: grouped[date],
      }
    })

    return sections
  }, [transactions])

  const renderSectionHeader = useCallback(
    ({ section: { title } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="8"
        paddingBottom="4"
        paddingHorizontal="6"
        backgroundColor="primaryBackground"
        justifyContent="center"
      >
        <Text variant="textXsRegular" textAlign="center" color="secondaryText">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box alignItems="center" gap="2.5">
        <Image source={require('@assets/images/transactionIcon.png')} />
        <Text
          variant="displayMdSemibold"
          textAlign="center"
          color="primaryText"
        >
          {t('activityScreen.title')}
        </Text>
        <Text
          variant="textLgRegular"
          textAlign="center"
          color="fg.quaternary-500"
        >
          {t('activityScreen.subtitle')}
        </Text>
      </Box>
    )
  }, [t])

  const handleActivityItemPress = useCallback(
    (transaction: EnrichedTransaction | ConfirmedSignatureInfo) => () => {
      triggerImpact()
      navigation.navigate('ActivityDetailsScreen', {
        transaction,
      })
    },
    [navigation, triggerImpact],
  )

  const renderItem = useCallback(
    ({ item, index, section }) => {
      const firstItem = index === 0
      const lastItem = index === section.data.length - 1

      return (
        <FadeInOut>
          <ActivityListItem
            borderTopStartRadius={firstItem ? 'xl' : undefined}
            borderTopEndRadius={firstItem ? 'xl' : undefined}
            borderBottomStartRadius={lastItem ? 'xl' : undefined}
            borderBottomEndRadius={lastItem ? 'xl' : undefined}
            hasDivider={!lastItem || (firstItem && section.data.length !== 1)}
            marginHorizontal="4"
            transaction={item}
            onPress={handleActivityItemPress(item)}
          />
        </FadeInOut>
      )
    },
    [handleActivityItemPress],
  )

  const Footer = useCallback(() => {
    return fetchingMore ? (
      <Box marginTop="4">
        <CircleLoader loaderSize={40} />
      </Box>
    ) : null
  }, [fetchingMore])

  const keyExtractor = useCallback((item, index) => item.signature + index, [])

  return (
    <ScrollBox backgroundColor="primaryBackground">
      <SectionList
        style={{
          backgroundColor: colors.primaryBackground,
        }}
        contentContainerStyle={contentContainer}
        sections={SectionData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loading}
            onRefresh={refresh}
            title=""
            tintColor={colors.primaryText}
          />
        }
        stickySectionHeadersEnabled={false}
        onEndReachedThreshold={0.05}
        // onEndReached={fetchMore}
        ListFooterComponent={Footer}
      />
    </ScrollBox>
  )
}

export default ActivityScreen
