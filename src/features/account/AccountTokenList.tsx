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
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { SlidersHorizontal } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { HideBottomEdgeEffect } from '../../../modules/scroll-edge-effect'
import { GovMints } from '../../utils/constants'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { deriveVisibleMints } from './logic/visibleTokens'
import { TokenListItem, TokenListGovItem, TokenSkeleton } from './TokenListItem'
import { useLockedAmounts, useTokenRows } from './useTokenRows'

const ManageIcon = withUniwind(SlidersHorizontal)

type Props = {
  onLayout?: BottomSheetFlatListProps<PublicKey>['onLayout']
  // Reports each cell's height by list index. The collapsed drawer shows the
  // first two token rows above the tab bar.
  onRowLayout?: (index: number, height: number) => void
}

const AccountTokenList = ({ onLayout, onRowLayout }: Props) => {
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

  // A governance token and its locked row count as one token.
  const renderItem = ({ item, index }: { item: PublicKey; index: number }) => {
    const mintStr = item.toBase58()
    const row = tokenRows[mintStr] ?? {
      loadingMetadata: true,
      loadingOwned: true,
    }
    return (
      <View
        onLayout={
          onRowLayout &&
          ((e) => onRowLayout(index, e.nativeEvent.layout.height))
        }
      >
        <TokenListItem mint={item} {...row} />
        {GovMints.some((m) => new PublicKey(m).equals(item)) && (
          <TokenListGovItem
            mint={item}
            symbol={row.symbol}
            image={row.image}
            loadingMetadata={row.loadingMetadata}
            decimals={row.decimals}
            amountLocked={lockedRows[mintStr]?.amountLocked}
            loadingAmount={lockedRows[mintStr]?.loadingAmount ?? true}
          />
        )}
      </View>
    )
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
      <>
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
        <TabSafeAreaView edges={['bottom']} />
      </>
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
    // iOS 26 places the tab bar's scroll edge effect on this list in the
    // list's own coordinates. The sheet moves by transform, which iOS does not
    // track, so the effect would sit over the rows instead of the bar. The
    // list hides it, and AccountsScreen draws a fade over the bar instead.
    <HideBottomEdgeEffect style={styles.list}>
      <BottomSheetFlatList
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
    </HideBottomEdgeEffect>
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
})

export default AccountTokenList
