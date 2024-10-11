import Box from '@components/Box'
import React, { ReactElement, useCallback, useEffect, useMemo } from 'react'
import BalanceText from '@components/BalanceText'
import { FlatList, RefreshControl } from 'react-native'
import { useBalance } from '@utils/Balance'
import { DC_MINT, truthy } from '@helium/spl-utils'
import { DEFAULT_TOKENS, useVisibleTokens } from '@storage/TokensProvider'
import { PublicKey } from '@solana/web3.js'
import {
  HeliumTokenListItem,
  TokenListItem,
  TokenSkeleton,
} from '@features/account/TokenListItem'
import { GovMints } from '@utils/constants'
import { useColors, useSpacing } from '@theme/themeHooks'
import WalletAlertBanner from '@components/WalletAlertBanner'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAsyncCallback } from 'react-async-hook'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useAppDispatch } from '@store/store'
import { syncTokenAccounts } from '@store/slices/balancesSlice'
import { useAccountFetchCache } from '@helium/account-fetch-cache-hooks'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { times } from 'lodash'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import Config from '@assets/images/config.svg'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { getSortValue } from '@utils/solanaUtils'
import { checkSecureAccount } from '@storage/secureStorage'
import { WalletNavigationProp } from './WalletPageNavigator'
import { useSolana } from '@/solana/SolanaProvider'

const TokensScreen = ({ Tabs }: { Tabs: ReactElement }) => {
  const { anchorProvider, cluster } = useSolana()
  const { tokenAccounts } = useBalance()
  const { visibleTokens } = useVisibleTokens()
  const colors = useColors()
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const cache = useAccountFetchCache()
  const navigation = useNavigation<WalletNavigationProp>()
  const { t } = useTranslation()
  const { total } = useBalance()

  const { loading: refetchingTokens, execute: refetchTokens } =
    useAsyncCallback(async () => {
      if (
        !anchorProvider ||
        !currentAccount ||
        !cluster ||
        !currentAccount?.solanaAddress
      )
        return
      await dispatch(
        syncTokenAccounts({ cluster, acct: currentAccount, anchorProvider }),
      )
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const solAddr = new PublicKey(currentAccount!.solanaAddress!)
      await Promise.all(
        [...visibleTokens].filter(truthy).map(async (mintStr) => {
          const ata = getAssociatedTokenAddressSync(
            new PublicKey(mintStr),
            solAddr,
          )
          const ataStr = ata.toBase58()
          // Trigger a refetch on all visible token accounts
          const result = await cache.search(
            ata,
            cache.keyToAccountParser.get(ataStr),
            false,
            true,
          )
          if (result?.account && cache.missingAccounts.has(ata.toBase58())) {
            cache.missingAccounts.delete(ata.toBase58())
            cache.updateCache(ataStr, result)
          } else if (
            !cache.genericCache.has(ataStr) ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line
            result != cache.genericCache[ataStr]
          ) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            cache.updateCache(ataStr, result)
            cache.emitter.raiseCacheUpdated(
              ataStr,
              true,
              cache.keyToAccountParser.get(ataStr),
            )
          }
          return result
        }),
      )
      // Trigger a refetch on all sol
      const result = await cache.search(
        solAddr,
        cache.keyToAccountParser.get(solAddr.toBase58()),
        false,
        true,
      )
      if (
        !cache.genericCache.has(solAddr.toBase58()) ||
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line
        result != cache.genericCache[solAddr.toBase58()]
      ) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cache.updateCache(solAddr.toBase58(), result)
      }
    })

  const mints = useMemo(() => {
    const taMints = tokenAccounts
      ?.filter(
        (ta) =>
          visibleTokens.has(ta.mint) &&
          ta.balance > 0 &&
          (ta.decimals > 0 || ta.mint === DC_MINT.toBase58()),
      )
      .map((ta) => ta.mint)

    const all = [...new Set([...DEFAULT_TOKENS, ...(taMints || [])])]
      .sort((a, b) => {
        return getSortValue(b) - getSortValue(a)
      })
      .map((mint) => new PublicKey(mint))

    return all
  }, [tokenAccounts, visibleTokens])

  const renderHeader = useCallback(() => {
    return (
      <Box marginBottom="3xl">
        {Tabs}
        <WalletAlertBanner />
        <Box alignItems="center" width="100%">
          <BalanceText amount={total} decimals={2} />
        </Box>
      </Box>
    )
  }, [total, Tabs])

  const contentContainerStyle = useMemo(
    () => ({
      backgroundColor: colors['base.white'],
      paddingTop: spacing['4'],
      paddingBottom: NavBarHeight + bottom,
    }),
    [colors, spacing, bottom],
  )

  useEffect(() => {
    if (currentAccount?.ledgerDevice) return
    // if current account is keystone account , check pass
    if (currentAccount?.keystoneDevice) return
    const address = currentAccount?.address
    if (address) checkSecureAccount(address)
  }, [
    currentAccount?.address,
    currentAccount?.ledgerDevice,
    currentAccount?.keystoneDevice,
  ])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: PublicKey }) => {
      if (GovMints.some((m) => new PublicKey(m).equals(item))) {
        return <HeliumTokenListItem mint={item} />
      }

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

  const onManageTokenList = useCallback(() => {
    navigation.navigate('AccountManageTokenListScreen')
  }, [navigation])

  const renderFooterComponent = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={onManageTokenList}
        flexDirection="row"
        justifyContent="center"
        marginVertical="4"
      >
        <Config />
        <Text variant="textSmRegular" ml="2" fontWeight="500" color="gray.400">
          {t('accountTokenList.manage')}
        </Text>
      </TouchableOpacityBox>
    )
  }, [onManageTokenList, t])

  const keyExtractor = useCallback((mint: PublicKey) => {
    const isGov = GovMints.some((m) => new PublicKey(m).equals(mint))
    return `${mint.toBase58()}${isGov ? '-gov' : ''}`
  }, [])

  return (
    <FlatList
      data={mints}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={refetchingTokens}
          onRefresh={refetchTokens}
          title=""
          tintColor={colors.primaryText}
        />
      }
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooterComponent}
      keyExtractor={keyExtractor}
      style={{
        backgroundColor: colors['base.white'],
      }}
    />
  )
}

export default TokensScreen
