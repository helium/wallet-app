import { BottomSheetFlatList, useBottomSheet } from '@gorhom/bottom-sheet'
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
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { GovMints } from '../../utils/constants'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { deriveVisibleMints } from './logic/visibleTokens'
import { TokenListItem, TokenListGovItem, TokenSkeleton } from './TokenListItem'

const ManageIcon = withUniwind(SlidersHorizontal)
const Fade = withUniwind(TabSafeAreaView)

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
  const { animatedIndex } = useBottomSheet()
  // Full at the collapsed snap, gone once the drawer is open.
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }))

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

  const bottomSpace = bottom * 2

  const renderItem = ({ item }: { item: PublicKey }) => {
    if (GovMints.some((m) => new PublicKey(m).equals(item)))
      return (
        <View>
          <TokenListItem mint={item} />
          <TokenListGovItem mint={item} />
        </View>
      )

    return <TokenListItem mint={item} />
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
    <>
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
      {/* The rows after the first two fade out behind the floating tab bar,
          which blurs them itself. The fade starts a little above the bar,
          so the row at the fold washes out too. */}
      {mints.length > 2 && (
        <Animated.View pointerEvents="none" style={[styles.fade, fadeStyle]}>
          <Fade
            edges={['bottom']}
            className="bg-linear-to-t from-secondary via-secondary/80 to-transparent"
          >
            <View className="h-12" />
          </Fade>
        </Animated.View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})

export default AccountTokenList
