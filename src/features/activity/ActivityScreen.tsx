import React from 'react'
import {
  RefreshControl,
  SectionList,
  SectionListRenderItem,
  View,
} from 'react-native'
import { EnrichedTransaction } from 'src/types/solana'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import useEnrichedTransactions from '@hooks/useEnrichedTransactions'
import { Spinner } from '@ui/Spinner'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ActivityNavigationProp } from './activityTypes'
import ActivityListItem from './ActivityListItem'

const SafeArea = withUniwind(SafeAreaView)

type Transaction = EnrichedTransaction | ConfirmedSignatureInfo
type Section = { title: string; data: Transaction[] }

const ActivityScreen = () => {
  const { transactions, loading, fetchingMore, fetchMore, refresh } =
    useEnrichedTransactions()
  const { t } = useTranslation()
  const navigation = useNavigation<ActivityNavigationProp>()

  // Group by date
  const grouped = transactions.reduce(
    (acc, tx) => {
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
    },
    {} as Record<string, Transaction[]>,
  )

  const sections: Section[] = Object.keys(grouped).map((date) => ({
    title: date,
    data: grouped[date],
  }))

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: Section
  }) => (
    <View className="flex-row items-center justify-center bg-background px-6 pb-4 pt-8">
      <Text size="xs" className="text-center text-muted-foreground">
        {title}
      </Text>
    </View>
  )

  const handleActivityItemPress = (transaction: Transaction) => () => {
    navigation.navigate('ActivityDetailsScreen', {
      transaction,
    })
  }

  const renderItem: SectionListRenderItem<Transaction, Section> = ({
    item,
    index,
    section,
  }) => {
    const firstItem = index === 0
    const lastItem = index === section.data.length - 1

    return (
      <ActivityListItem
        className={twMerge(
          'mx-4',
          firstItem && 'rounded-t-[20px]',
          lastItem && 'rounded-b-[20px]',
        )}
        hasDivider={!lastItem || (firstItem && section.data.length !== 1)}
        transaction={item}
        onPress={handleActivityItemPress(item)}
      />
    )
  }

  const keyExtractor = (item: Transaction, index: number) =>
    item.signature + index

  return (
    <View className="flex-1">
      <SafeArea edges={['top']}>
        <SectionList
          contentContainerClassName="pb-15"
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={
            <View className="bg-background px-6 pb-4 pt-12">
              <Text size="xl" className="text-center">
                {t('activityScreen.title')}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              enabled
              refreshing={loading}
              onRefresh={() => void refresh().catch(console.error)}
              title=""
              tintColorClassName="accent-foreground"
            />
          }
          onEndReachedThreshold={0.05}
          onEndReached={() => void fetchMore().catch(console.error)}
          ListFooterComponent={
            <>
              {fetchingMore && (
                <View className="mt-4">
                  <Spinner size="large" />
                </View>
              )}
              <TabSafeAreaView edges={['bottom']} />
            </>
          }
        />
      </SafeArea>
    </View>
  )
}

export default ActivityScreen
