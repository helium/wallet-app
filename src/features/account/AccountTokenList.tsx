import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useBalance } from '@utils/Balance'
import { syncTokenAccounts } from '@utils/balances'
import { times } from 'lodash'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { SlidersHorizontal } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { GovMints } from '../../utils/constants'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { deriveVisibleMints } from './logic/visibleTokens'
import { TokenListItem, TokenListGovItem, TokenSkeleton } from './TokenListItem'
import { useLockedAmounts, useTokenRows } from './useTokenRows'

const ManageIcon = withUniwind(SlidersHorizontal)

type Props = {
  onLayout?: BottomSheetFlatListProps<PublicKey>['onLayout']
}

const AccountTokenList = ({ onLayout }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { visibleTokens } = useVisibleTokens()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, cluster } = useSolana()
  const queryClient = useQueryClient()

  const { isPending: refetchingTokens, mutate: refetchTokens } = useMutation({
    mutationFn: async () => {
      if (
        !anchorProvider ||
        !currentAccount ||
        !cluster ||
        !currentAccount?.solanaAddress
      )
        return

      // Sync the token accounts to get accurate balances from blockchain
      // This is the source of truth and will update the UI correctly
      try {
        await syncTokenAccounts(queryClient, {
          cluster,
          acct: currentAccount,
          anchorProvider,
        })
        // Successfully synced token accounts
      } catch {
        // Swallow sync errors (likely cooldown blocks)
      }
    },
  })

  // Note: Removed automatic refresh on app state change since Balance.tsx
  // already handles token syncing via syncTokenAccounts(). The UI updates
  // automatically when the token accounts query changes.
  //
  // Manual refresh is still available via pull-to-refresh gesture.
  const onManageTokenList = () => {
    navigation.navigate('AccountManageTokenListScreen')
  }
  const { tokenAccounts } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const mints = deriveVisibleMints({ tokenAccounts, visibleTokens }).map(
    (mint) => new PublicKey(mint),
  )

  const tokenRows = useTokenRows(mints)
  const lockedRows = useLockedAmounts(
    mints.filter((mint) => GovMints.some((m) => new PublicKey(m).equals(mint))),
  )

  const bottomSpace = bottom * 2

  const renderItem = ({ item }: { item: PublicKey }) => {
    const mintStr = item.toBase58()
    const row = tokenRows[mintStr] ?? {
      loadingMetadata: true,
      loadingOwned: true,
    }
    if (GovMints.some((m) => new PublicKey(m).equals(item)))
      return (
        <View>
          <TokenListItem mint={item} {...row} />
          <TokenListGovItem
            mint={item}
            symbol={row.symbol}
            image={row.image}
            loadingMetadata={row.loadingMetadata}
            decimals={row.decimals}
            amountLocked={lockedRows[mintStr]?.amountLocked}
            loadingAmount={lockedRows[mintStr]?.loadingAmount ?? true}
          />
        </View>
      )

    return <TokenListItem mint={item} {...row} />
  }

  const renderEmptyComponent = () => {
    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }

  const renderFooterComponent = () => {
    return (
      <PressableScale
        feedback="opacity"
        onPress={onManageTokenList}
        className="mt-4 flex-row items-center justify-center"
      >
        <ManageIcon colorClassName="accent-muted-foreground" />
        <Text className="ml-2 font-medium text-muted-foreground">
          {t('accountTokenList.manage')}
        </Text>
      </PressableScale>
    )
  }

  const keyExtractor = (mint: PublicKey) => {
    const isGov = GovMints.some((m) => new PublicKey(m).equals(mint))
    return `${mint.toBase58()}${isGov ? '-gov' : ''}`
  }

  const contentContainerStyle = {
    paddingBottom: bottomSpace,
  }

  return (
    <BottomSheetFlatList
      contentInsetAdjustmentBehavior="automatic"
      onLayout={onLayout}
      data={mints}
      numColumns={2}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={refetchingTokens}
          onRefresh={() => refetchTokens()}
          title=""
          tintColorClassName="accent-foreground"
        />
      }
      refreshing={refetchingTokens}
      onRefresh={() => refetchTokens()}
      columnWrapperStyle={{
        flexDirection: 'column',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooterComponent}
      keyExtractor={keyExtractor}
    />
  )
}

export default AccountTokenList
