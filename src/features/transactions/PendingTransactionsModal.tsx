import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { usePendingTransactions } from '@hooks/usePendingTransactions'
import { useTransactionBatchStatus } from '@hooks/useTransactionBatchStatus'
import React, { FC, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Platform, RefreshControl } from 'react-native'
import { Edge } from 'react-native-safe-area-context'

type TransactionItemProps = {
  batchId: string
  tag?: string
  onPress: (batchId: string) => void
}

const TransactionItem = ({ batchId, tag, onPress }: TransactionItemProps) => {
  const { status, isLoading } = useTransactionBatchStatus(batchId)

  const statusColor = useMemo(() => {
    switch (status) {
      case 'confirmed':
        return 'greenBright500'
      case 'failed':
      case 'expired':
        return 'red500'
      case 'partial':
        return 'orange500'
      case 'pending':
      default:
        return 'blueBright500'
    }
  }, [status])

  const statusText = useMemo(() => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'failed':
        return 'Failed'
      case 'expired':
        return 'Expired'
      case 'partial':
        return 'Partial'
      case 'pending':
      default:
        return 'Pending'
    }
  }, [status])

  const handlePress = useCallback(() => {
    onPress(batchId)
  }, [batchId, onPress])

  return (
    <ButtonPressable
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      padding="m"
      marginBottom="s"
      onPress={handlePress}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Box flex={1}>
        <Text variant="body2Medium" color="white" numberOfLines={1}>
          {tag || 'Transaction'}
        </Text>
        <Text variant="body3" color="secondaryText" numberOfLines={1}>
          {batchId.slice(0, 8)}...{batchId.slice(-8)}
        </Text>
      </Box>
      <Box flexDirection="row" alignItems="center">
        {isLoading ? (
          <CircleLoader loaderSize={16} color="white" />
        ) : (
          <Box
            backgroundColor={statusColor}
            borderRadius="round"
            paddingHorizontal="s"
            paddingVertical="xs"
          >
            <Text variant="body3" color="black">
              {statusText}
            </Text>
          </Box>
        )}
      </Box>
    </ButtonPressable>
  )
}

type Props = {
  visible: boolean
  onClose: () => void
}

const PendingTransactionsModal: FC<Props> = ({ visible, onClose }) => {
  const { t } = useTranslation()
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const {
    pendingTransactions,
    isLoading,
    refetch,
  } = usePendingTransactions()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleTransactionPress = useCallback((_batchId: string) => {
    // Could navigate to transaction details in the future
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: { batchId: string; tag?: string } }) => (
      <TransactionItem
        batchId={item.batchId}
        tag={item.tag}
        onPress={handleTransactionPress}
      />
    ),
    [handleTransactionPress],
  )

  const keyExtractor = useCallback(
    (item: { batchId: string }) => item.batchId,
    [],
  )

  if (!visible) return null

  return (
    <>
      {Platform.OS === 'android' && (
        <Box
          position="absolute"
          zIndex={0}
          left={0}
          top={0}
          height="100%"
          width="100%"
          backgroundColor="black"
        />
      )}
      <ReAnimatedBlurBox
        entering={FadeInFast}
        position="absolute"
        zIndex={9999}
        height="100%"
        width="100%"
        tint="dark"
        intensity={80}
      >
        <SafeAreaBox edges={edges} flex={1}>
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="m"
            paddingVertical="m"
          >
            <Text variant="h4" color="white">
              {t('pendingTransactions.title', { defaultValue: 'Transactions' })}
            </Text>
            <ButtonPressable
              backgroundColor="transparent"
              onPress={onClose}
              padding="s"
            >
              <Text variant="body2" color="blueBright500">
                {t('generic.close', { defaultValue: 'Close' })}
              </Text>
            </ButtonPressable>
          </Box>

          <Box flex={1} paddingHorizontal="m">
            {isLoading && pendingTransactions.length === 0 ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <CircleLoader loaderSize={30} color="white" />
                <Text variant="body2" color="secondaryText" marginTop="m">
                  {t('pendingTransactions.loading', {
                    defaultValue: 'Loading transactions...',
                  })}
                </Text>
              </Box>
            ) : pendingTransactions.length === 0 ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="body1" color="secondaryText" textAlign="center">
                  {t('pendingTransactions.empty', {
                    defaultValue: 'No pending transactions',
                  })}
                </Text>
              </Box>
            ) : (
              <FlatList
                data={pendingTransactions}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="white"
                  />
                }
              />
            )}
          </Box>
        </SafeAreaBox>
      </ReAnimatedBlurBox>
    </>
  )
}

export default memo(PendingTransactionsModal)

