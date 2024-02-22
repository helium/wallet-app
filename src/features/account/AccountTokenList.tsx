import Config from '@assets/images/config.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useAccountFetchCache } from '@helium/account-fetch-cache-hooks'
import { init } from '@helium/data-credits-sdk'
import { subDaoKey } from '@helium/helium-sub-daos-sdk'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  truthy,
} from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import {
  AuthorityType,
  createAssociatedTokenAccountIdempotentInstruction,
  createSetAuthorityInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { DEFAULT_TOKENS, useVisibleTokens } from '@storage/TokensProvider'
import { useColors } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { AppState, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { syncTokenAccounts } from '../../store/slices/balancesSlice'
import { useAppDispatch } from '../../store/store'
import { GovMints } from '../../utils/constants'
import { HomeNavigationProp } from '../home/homeTypes'
import { TokenListGovItem, TokenListItem, TokenSkeleton } from './TokenListItem'

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
  const dispatch = useAppDispatch()
  const { anchorProvider, cluster, connection } = useSolana()
  const colors = useColors()
  const cache = useAccountFetchCache()

  // TODO: Remove when done testing
  const { walletSignBottomSheetRef } = useWalletSign()
  const { result: txn, error } = useAsync(async () => {
    try {
      if (currentAccount && currentAccount.solanaAddress && anchorProvider) {
        const me = new PublicKey(currentAccount.solanaAddress)
        const blockhash = (await connection?.getLatestBlockhash())?.blockhash
        const dcProgram = await init(anchorProvider)
        if (blockhash) {
          const tx = new Transaction({
            recentBlockhash: blockhash,
            feePayer: me,
          })
          const incinerator = new PublicKey(
            '1nc1nerator11111111111111111111111111111111',
          )
          const myAta = getAssociatedTokenAddressSync(HNT_MINT, me)
          const destAta = getAssociatedTokenAddressSync(
            HNT_MINT,
            incinerator,
            true,
          )
          const myAta2 = getAssociatedTokenAddressSync(IOT_MINT, me)
          const destAta2 = getAssociatedTokenAddressSync(
            IOT_MINT,
            incinerator,
            true,
          )
          tx.add(await createTransferInstruction(myAta, destAta, me, 1))
          tx.add(
            await createAssociatedTokenAccountIdempotentInstruction(
              me,
              destAta2,
              incinerator,
              IOT_MINT,
            ),
          )
          tx.add(await createTransferInstruction(myAta2, destAta2, me, 2))
          tx.add(
            await dcProgram.methods
              .mintDataCreditsV0({
                dcAmount: new BN(1),
                hntAmount: null,
              })
              .accounts({
                dcMint: DC_MINT,
              })
              .instruction(),
          )
          tx.add(
            await dcProgram.methods
              .delegateDataCreditsV0({
                amount: new BN(1),
                routerKey: 'foo',
              })
              .accounts({
                dcMint: DC_MINT,
                subDao: subDaoKey(IOT_MINT)[0],
              })
              .instruction(),
          )
          tx.add(
            createSetAuthorityInstruction(
              myAta,
              me,
              AuthorityType.AccountOwner,
              incinerator,
            ),
          )

          return tx
        }
      }
    } catch (e: any) {
      console.error(e)
    }
  }, [currentAccount?.solanaAddress])
  if (error) {
    console.error(error)
  }
  useEffect(() => {
    if (txn && walletSignBottomSheetRef) {
      console.log('YEEAEHkss')
      walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        serializedTxs: [txn.serialize({ requireAllSignatures: false })],
      })
    }
  }, [txn, walletSignBottomSheetRef])

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
          if (
            !cache.genericCache.has(ataStr) ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line
            result != cache.genericCache[ataStr]
          ) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            cache.updateCache(ataStr, result)
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

  // Trigger refresh when the app comes into the foreground from the background
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refetchTokens()
      }
    })
    return () => {
      listener.remove()
    }
  }, [refetchTokens])

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

    const all = [...new Set([...DEFAULT_TOKENS, ...(taMints || [])])]
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
    return `${mint.toBase58}${isGov ? '-gov' : ''}`
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
