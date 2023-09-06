import Close from '@assets/images/close.svg'
import Box from '@components/Box'
import IconPressedContainer from '@components/IconPressedContainer'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT } from '@helium/spl-utils'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import CheckBox from '@react-native-community/checkbox'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useColors, useHitSlop } from '@theme/themeHooks'
import { useBalance } from '@utils/Balance'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { syncTokenAccounts } from '../../store/slices/balancesSlice'
import { useAppDispatch } from '../../store/store'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import { getSortValue } from './AccountTokenList'

const CheckableTokenListItem = ({
  bottomBorder,
  mint: token,
  checked,
  onUpdateTokens,
}: {
  bottomBorder: boolean
  mint: string
  checked: boolean
  onUpdateTokens: (_token: PublicKey, _value: boolean) => void
}) => {
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
      onPress={() => {}}
      flexDirection="row"
      minHeight={72}
      alignItems="center"
      paddingHorizontal="m"
      paddingVertical="m"
      borderBottomColor="primaryBackground"
      borderBottomWidth={bottomBorder ? 0 : 1}
      disabled
    >
      <TokenIcon img={json?.image} />
      <Box flex={1} paddingHorizontal="m">
        <Box flexDirection="row" alignItems="center">
          <Text variant="body1" color="primaryText" maxFontSizeMultiplier={1.3}>
            {`${balanceToDisplay} `}
          </Text>
          <Text
            variant="body2Medium"
            color="secondaryText"
            maxFontSizeMultiplier={1.3}
          >
            {symbol}
          </Text>
        </Box>
        {symbol && (
          <AccountTokenCurrencyBalance
            variant="subtitle4"
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
            false: colors.transparent10,
          }}
          onCheckColor={colors.secondary}
          onTintColor={colors.primaryText}
          tintColor={colors.transparent10}
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
  const navigation = useNavigation<HomeNavigationProp>()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')
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
      return (
        <CheckableTokenListItem
          mint={token}
          bottomBorder={index === (mints?.length || 0) - 1}
          checked={visibleTokens.has(token)}
          onUpdateTokens={setVisibleTokens}
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
    <SafeAreaBox flex={1} edges={safeEdges}>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        borderTopStartRadius="xl"
        borderTopEndRadius="xl"
        marginBottom="m"
      >
        <Box hitSlop={hitSlop} padding="s">
          <IconPressedContainer
            onPress={navigation.goBack}
            activeOpacity={0.75}
            idleOpacity={1.0}
          >
            <Close color={primaryText} height={16} width={16} />
          </IconPressedContainer>
        </Box>
      </Box>

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
    </SafeAreaBox>
  )
}

export default memo(AccountManageTokenListScreen)
