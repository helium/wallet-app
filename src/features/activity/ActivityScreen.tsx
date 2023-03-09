import React, { useCallback, useMemo } from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { EnrichedTransaction } from 'src/types/solana'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import Text from '@components/Text'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import CircleLoader from '@components/CircleLoader'
import FadeInOut, { DelayedFadeIn } from '@components/FadeInOut'
import { ReAnimatedBox } from '@components/AnimatedBox'
import useHaptic from '@hooks/useHaptic'
import globalStyles from '@theme/globalStyles'
import { useColors, useSpacing } from '@theme/themeHooks'
import { ActivityNavigationProp } from './activityTypes'
import ActivityListItem from './ActivityListItem'

const ActivityScreen = () => {
  const { transactions, loading, fetchingMore, fetchMore, refresh } =
    useEnrichedTransactions()
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const navigation = useNavigation<ActivityNavigationProp>()
  const { triggerImpact } = useHaptic()

  const contentContainer = useMemo(
    () => ({
      paddingBottom: spacing.xxxl,
    }),
    [spacing.xxxl],
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
    ({ section: { title, icon } }) => (
      <Box
        flexDirection="row"
        alignItems="center"
        paddingTop="xl"
        paddingBottom="m"
        paddingHorizontal="l"
        backgroundColor="primaryBackground"
        justifyContent="center"
      >
        {icon !== undefined && icon}
        <Text variant="body3" textAlign="center" color="secondaryText">
          {title}
        </Text>
      </Box>
    ),
    [],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box
        paddingTop="xxl"
        paddingBottom="m"
        paddingHorizontal="l"
        backgroundColor="primaryBackground"
      >
        <Text variant="h4" textAlign="center">
          {t('activityScreen.title')}
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

  const safeEdges = useMemo(() => ['top'] as Edge[], [])

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
            marginHorizontal="m"
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
      <Box marginTop="m">
        <CircleLoader loaderSize={40} />
      </Box>
    ) : null
  }, [fetchingMore])

  const keyExtractor = useCallback((item, index) => item.signature + index, [])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges}>
        <SectionList
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
          onEndReachedThreshold={0.05}
          onEndReached={fetchMore}
          ListFooterComponent={Footer}
        />
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default ActivityScreen
