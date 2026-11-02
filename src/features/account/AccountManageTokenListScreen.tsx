import { DC_MINT } from '@helium/spl-utils'
import { usePublicKey } from '@hooks/usePublicKey'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Checkbox } from '@ui/Checkbox'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { twMerge } from '@ui/twMerge'
import { useBalance } from '@utils/Balance'
import { syncTokenAccounts } from '@utils/balances'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import { X } from 'lucide-react-native'
import React, { useRef } from 'react'
import { RefreshControl, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import { getSortValue } from './logic/visibleTokens'
import { TokenRowData, useTokenRows } from './useTokenRows'

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)

const HIT_SLOP = { top: 24, bottom: 24, left: 24, right: 24 }

// A list row. The screen reads the metadata and balances of all rows once
// (useTokenRows); the row only renders them.
export const CheckableTokenListItem = ({
  bottomBorder,
  mint: token,
  checked,
  onUpdateTokens,
  symbol,
  image,
  amount,
  decimals,
}: {
  bottomBorder: boolean
  mint: string
  checked: boolean
  onUpdateTokens: (_token: PublicKey, _value: boolean) => void
} & Pick<TokenRowData, 'symbol' | 'image' | 'amount' | 'decimals'>) => {
  const mint = usePublicKey(token)
  const isMountedRef = useRef(true)

  const balanceToDisplay =
    amount && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amount.toString()), decimals)
      : ''

  const handleValueChange = () => {
    try {
      if (isMountedRef.current && mint) {
        onUpdateTokens(mint, !checked)
      }
    } catch (error) {
      console.warn('CheckBox onValueChange error:', error)
    }
  }

  React.useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <View
      className={twMerge(
        'min-h-[72px] flex-row items-center border-border px-4 py-4',
        !bottomBorder && 'border-b',
      )}
    >
      <TokenIcon img={image} />
      <View className="flex-1 px-4">
        <View className="flex-row items-center">
          <Text size="base" maxFontSizeMultiplier={1.3}>
            {`${balanceToDisplay} `}
          </Text>
          <Text
            className="font-medium text-muted-foreground"
            maxFontSizeMultiplier={1.3}
          >
            {symbol}
          </Text>
        </View>
        {!!symbol && (
          <AccountTokenCurrencyBalance
            className="font-medium text-muted-foreground"
            ticker={symbol.toUpperCase()}
          />
        )}
      </View>
      <View className="me-1 items-center justify-center">
        <Checkbox checked={checked} onChange={handleValueChange} />
      </View>
    </View>
  )
}

const AccountManageTokenListScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { visibleTokens, setVisibleTokens } = useVisibleTokens()
  const { tokenAccounts } = useBalance()
  const mints = tokenAccounts
    ?.filter(
      (ta) =>
        ta.balance > 0 && (ta.decimals > 0 || ta.mint === DC_MINT.toBase58()),
    )
    .map((ta) => ta.mint)
    .sort((a, b) => {
      return getSortValue(b) - getSortValue(a)
    })
  const tokenRows = useTokenRows((mints || []).map((m) => new PublicKey(m)))
  const queryClient = useQueryClient()
  const { anchorProvider, cluster } = useSolana()
  const { currentAccount } = useAccountStorage()

  const { isPending: refetchingTokens, mutate: refetchTokens } = useMutation({
    mutationFn: async () => {
      if (!anchorProvider || !currentAccount || !cluster) return
      try {
        await syncTokenAccounts(queryClient, {
          cluster,
          acct: currentAccount,
          anchorProvider,
        })
      } catch {
        // Swallow sync errors (likely cooldown blocks)
      }
    },
  })
  const renderItem = ({
    index,
    item: token,
  }: {
    index: number
    item: string
  }) => {
    const row = tokenRows[token]
    return (
      <CheckableTokenListItem
        mint={token}
        bottomBorder={index === (mints?.length || 0) - 1}
        checked={visibleTokens.has(token)}
        onUpdateTokens={setVisibleTokens}
        symbol={row?.symbol}
        image={row?.image}
        amount={row?.amount}
        decimals={row?.decimals}
      />
    )
  }

  const keyExtractor = (item: string) => {
    return item
  }

  return (
    <SafeArea className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center justify-between">
        <PressableScale
          feedback="opacity"
          onPress={navigation.goBack}
          hitSlop={HIT_SLOP}
          className="p-2"
        >
          <CloseIcon colorClassName="accent-foreground" />
        </PressableScale>
      </View>

      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            enabled
            refreshing={refetchingTokens}
            onRefresh={() => refetchTokens()}
            title=""
            tintColorClassName="accent-foreground"
          />
        }
        data={mints}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </SafeArea>
  )
}

export default AccountManageTokenListScreen
