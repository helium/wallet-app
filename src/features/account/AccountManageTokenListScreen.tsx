import Box from '@components/Box'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import CheckBox from '@react-native-community/checkbox'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useColors } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
import { getSortValue, humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Edge } from 'react-native-safe-area-context'
import BackScreen from '@components/BackScreen'
import ScrollBox from '@components/ScrollBox'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useSolana } from '../../solana/SolanaProvider'
import { syncTokenAccounts } from '../../store/slices/balancesSlice'
import { useAppDispatch } from '../../store/store'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'

const CheckableTokenListItem = ({
  bottomBorder,
  mint: token,
  checked,
  onUpdateTokens,
  ...rest
}: {
  bottomBorder: boolean
  mint: string
  checked: boolean
  onUpdateTokens: (_token: PublicKey, _value: boolean) => void
} & BoxProps<Theme>) => {
  const mint = usePublicKey(token)
  const wallet = useCurrentWallet()
  const { amount, decimals } = useOwnedAmount(wallet, mint)
  const { json, symbol } = useMetaplexMetadata(mint)
  const balanceToDisplay = useMemo(() => {
    return amount && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amount.toString()), decimals)
      : ''
  }, [amount, decimals])
  const colors = useColors()

  return (
    <TouchableContainer
      flexDirection="row"
      minHeight={72}
      alignItems="center"
      paddingHorizontal="4"
      paddingVertical="4"
      borderBottomColor="primaryBackground"
      borderBottomWidth={bottomBorder ? 2 : 0}
      disabled
      {...rest}
    >
      <TokenIcon img={json?.image} />
      <Box flex={1} paddingHorizontal="4">
        <Box flexDirection="row" alignItems="center">
          <Text
            variant="textMdRegular"
            color="primaryText"
            maxFontSizeMultiplier={1.3}
          >
            {`${balanceToDisplay} `}
          </Text>
          <Text
            variant="textSmMedium"
            color="secondaryText"
            maxFontSizeMultiplier={1.3}
          >
            {symbol}
          </Text>
        </Box>
        {symbol && (
          <AccountTokenCurrencyBalance
            variant="textSmMedium"
            color="secondaryText"
            ticker={symbol.toUpperCase()}
          />
        )}
      </Box>
      <Box justifyContent="center" alignItems="center" marginEnd="xs">
        <CheckBox
          value={checked}
          style={{ height: 18, width: 18 }}
          tintColors={{
            true: colors.primaryText,
            false: colors.primaryText,
          }}
          onCheckColor={colors.primaryBackground}
          onTintColor={colors.primaryText}
          tintColor={colors.primaryText}
          onFillColor={colors.primaryText}
          onAnimationType="fill"
          offAnimationType="fill"
          boxType="square"
          onValueChange={() => mint && onUpdateTokens(mint, !checked)}
        />
      </Box>
    </TouchableContainer>
  )
}

const AccountManageTokenListScreen: React.FC = () => {
  const { visibleTokens, setVisibleTokens } = useVisibleTokens()
  const { tokenAccounts } = useBalance()
  const mints = useMemo(() => {
    return tokenAccounts
      ?.filter(
        (ta) =>
          ta.balance > 0 && (ta.decimals > 0 || ta.mint === DC_MINT.toBase58()),
      )
      .map((ta) => ta.mint)
      .sort((a, b) => {
        return getSortValue(b) - getSortValue(a)
      })
  }, [tokenAccounts])
  const dispatch = useAppDispatch()
  const { anchorProvider, cluster } = useSolana()
  const { currentAccount } = useAccountStorage()
  const colors = useColors()

  const { loading: refetchingTokens, execute: refetchTokens } =
    useAsyncCallback(async () => {
      if (!anchorProvider || !currentAccount || !cluster) return
      await dispatch(
        syncTokenAccounts({ cluster, acct: currentAccount, anchorProvider }),
      )
    })
  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: token }: { index: number; item: string }) => {
      const isFirst = index === 0
      const isLast = index === (mints?.length || 0) - 1
      const borderTopStartRadius = isFirst ? 'xl' : 'none'
      const borderTopEndRadius = isFirst ? 'xl' : 'none'
      const borderBottomStartRadius = isLast ? 'xl' : 'none'
      const borderBottomEndRadius = isLast ? 'xl' : 'none'

      return (
        <CheckableTokenListItem
          mint={token}
          bottomBorder={!isLast}
          checked={visibleTokens.has(token)}
          onUpdateTokens={setVisibleTokens}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
        />
      )
    },
    [mints?.length, visibleTokens, setVisibleTokens],
  )

  const keyExtractor = useCallback((item: string) => {
    return item
  }, [])
  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <ScrollBox>
      <BackScreen>
        <FlatList
          refreshControl={
            <RefreshControl
              enabled
              refreshing={refetchingTokens}
              onRefresh={refetchTokens}
              title=""
              tintColor={colors.primaryText}
            />
          }
          data={mints}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </BackScreen>
    </ScrollBox>
  )
}

export default memo(AccountManageTokenListScreen)
