import Config from '@assets/images/config.svg'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DEFAULT_TOKENS, useVisibleTokens } from '@storage/TokensProvider'
import { useColors } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
import { times } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Box from '@components/Box'
import { GovMints } from '../../utils/constants'
import { useSolana } from '../../solana/SolanaProvider'
import { syncTokenAccounts } from '../../store/slices/balancesSlice'
import { useAppDispatch } from '../../store/store'
import { HomeNavigationProp } from '../home/homeTypes'
import { TokenListItem, TokenListGovItem, TokenSkeleton } from './TokenListItem'

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

type Props = {
  onLayout?: BottomSheetFlatListProps<PublicKey>['onLayout']
}

const sortValues: Record<string, number> = {
  [HNT_MINT.toBase58()]: 10,
  [IOT_MINT.toBase58()]: 9,
  [MOBILE_MINT.toBase58()]: 8,
  [DC_MINT.toBase58()]: 7,
}
export function getSortValue(mint: string): number {
  return sortValues[mint] || 0
}

const AccountTokenList = ({ onLayout }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { visibleTokens } = useVisibleTokens()
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, cluster } = useSolana()
  const colors = useColors()
  const dispatch = useAppDispatch()

  const { loading: refetchingTokens, execute: refetchTokens } =
    useAsyncCallback(async () => {
      if (
        !anchorProvider ||
        !currentAccount ||
        !cluster ||
        !currentAccount?.solanaAddress
      )
        return

      // Trigger Redux state sync to get accurate balances from blockchain
      // This is the source of truth and will update the UI correctly
      try {
        await dispatch(
          syncTokenAccounts({
            cluster,
            acct: currentAccount,
            anchorProvider,
          }),
        )
        // Successfully synced token accounts
      } catch (_err) {
        // Swallow sync errors (likely cooldown blocks)
      }
    })

  // Note: Removed automatic refresh on app state change since Balance.tsx
  // already handles token syncing via syncTokenAccounts(). The UI updates
  // automatically when Redux state changes.
  //
  // Manual refresh is still available via pull-to-refresh gesture.
  const onManageTokenList = useCallback(() => {
    navigation.navigate('AccountManageTokenListScreen')
  }, [navigation])
  const { tokenAccounts } = useBalance()
  const { bottom } = useSafeAreaInsets()
  const mints = useMemo(() => {
    const taMints = tokenAccounts
      ?.filter(
        (ta) =>
          visibleTokens.has(ta.mint) &&
          ta.balance > 0 &&
          (ta.decimals > 0 || ta.mint === DC_MINT.toBase58()),
      )
      .map((ta) => ta.mint)

    // Start with DEFAULT_TOKENS, then filter out any that have zero balance
    // (unless they're not in tokenAccounts at all, meaning no account exists)
    const all = [...new Set([...DEFAULT_TOKENS, ...(taMints || [])])]
      .filter((mintStr) => {
        // If token has an account, only show if balance > 0
        const tokenAccount = tokenAccounts?.find((ta) => ta.mint === mintStr)
        if (tokenAccount) {
          return (
            tokenAccount.balance > 0 ||
            tokenAccount.mint === DC_MINT.toBase58() ||
            tokenAccount.mint === NATIVE_MINT.toBase58() ||
            tokenAccount.mint === USDC_MINT.toBase58()
          )
        }
        // If no token account exists, show the default token (user can add it later)
        return true
      })
      .sort((a, b) => {
        return getSortValue(b) - getSortValue(a)
      })
      .map((mint) => new PublicKey(mint))

    return all
  }, [tokenAccounts, visibleTokens])

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: PublicKey }) => {
      if (GovMints.some((m) => new PublicKey(m).equals(item)))
        return (
          <Box>
            <TokenListItem mint={item} />
            <TokenListGovItem mint={item} />
          </Box>
        )

      return <TokenListItem mint={item} />
    },
    [],
  )

  const renderEmptyComponent = useCallback(() => {
    return (
      <>
        {times(4).map((i) => (
          <TokenSkeleton key={i} />
        ))}
      </>
    )
  }, [])

  const renderFooterComponent = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={onManageTokenList}
        flexDirection="row"
        justifyContent="center"
        mt="m"
      >
        <Config />
        <Text ml="s" fontWeight="500" color="grey400">
          {t('accountTokenList.manage')}
        </Text>
      </TouchableOpacityBox>
    )
  }, [onManageTokenList, t])

  const keyExtractor = useCallback((mint: PublicKey) => {
    const isGov = GovMints.some((m) => new PublicKey(m).equals(mint))
    return `${mint.toBase58()}${isGov ? '-gov' : ''}`
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  return (
    <BottomSheetFlatList
      onLayout={onLayout}
      data={mints}
      numColumns={2}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={refetchingTokens}
          onRefresh={refetchTokens}
          title=""
          tintColor={colors.primaryText}
        />
      }
      refreshing={refetchingTokens}
      onRefresh={refetchTokens}
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
