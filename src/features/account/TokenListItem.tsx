import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import { ChevronRight, Lock, TriangleAlert } from 'lucide-react-native'
import React from 'react'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { withUniwind } from 'uniwind'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import { LockedRowData, TokenRowData } from './useTokenRows'

const Arrow = withUniwind(ChevronRight)
const LockIcon = withUniwind(Lock)
const WarningIcon = withUniwind(TriangleAlert)

const ROW_CLASS =
  'min-h-[72px] flex-row items-center border-b border-border px-4 py-4'

export const ITEM_HEIGHT = 72
type Props = {
  mint: PublicKey
} & TokenRowData

export const TokenSkeleton = () => {
  return (
    <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
      <View className="h-[72px] flex-row items-center border-b border-border px-6">
        <View className="h-10 w-10 rounded-full bg-card" />
        <View className="flex-1 px-4">
          <View className="h-4 w-[120px] bg-card" />
          <View className="mt-2 h-4 w-[70px] bg-card" />
        </View>
        <Arrow colorClassName="accent-muted-foreground" />
      </View>
    </Animated.View>
  )
}

// A list row. The list reads the metadata and balances of all rows once
// (useTokenRows); the row only renders them.
export const TokenListItem = ({
  mint,
  symbol,
  image,
  loadingMetadata,
  amount,
  decimals,
  loadingOwned,
}: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const mintStr = mint.toBase58()

  const handleNavigation = () => {
    navigation.navigate('AccountTokenScreen', {
      mint: mintStr,
    })
  }

  const balanceToDisplay =
    amount && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amount.toString()), decimals)
      : '0'

  if (
    (mint.equals(MOBILE_MINT) || mint.equals(IOT_MINT)) &&
    balanceToDisplay === '0'
  ) {
    return null
  }

  return (
    <PressableScale
      feedback="opacity"
      testID={`TokenListItem.${symbol}`}
      onPress={handleNavigation}
      className={ROW_CLASS}
    >
      {loadingMetadata ? (
        <View className="h-10 w-10 rounded-full bg-card" />
      ) : (
        <TokenIcon img={image} />
      )}

      <View className="flex-1 px-4">
        {loadingOwned ? (
          <View className="flex-1 px-4">
            <View className="h-4 w-[120px] bg-card" />
            <View className="mt-2 h-4 w-[70px] bg-card" />
          </View>
        ) : (
          <View>
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
        )}
      </View>
      {mint.equals(NATIVE_MINT) && (amount || 0) < MIN_BALANCE_THRESHOLD && (
        <View className="mr-4">
          <WarningIcon size={28} colorClassName="accent-warning-500" />
        </View>
      )}
      <Arrow colorClassName="accent-muted-foreground" />
    </PressableScale>
  )
}

// A list row for the tokens locked in voting positions. The list reads the
// positions of all governance mints once (useLockedAmounts).
export const TokenListGovItem = ({
  mint,
  symbol,
  image,
  loadingMetadata,
  decimals,
  amountLocked,
  loadingAmount,
}: {
  mint: PublicKey
} & Omit<TokenRowData, 'amount' | 'loadingOwned'> &
  LockedRowData) => {
  const navigation = useNavigation()
  const mintStr = mint.toBase58()

  const handleNavigation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigation as any).navigate('Governance', {
      screen: 'PositionsScreen',
      initial: false,
      params: { mint: mintStr },
    })
  }

  const balanceToDisplay =
    amountLocked && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amountLocked.toString()), decimals)
      : '0'

  if (
    (mint.equals(MOBILE_MINT) || mint.equals(IOT_MINT)) &&
    balanceToDisplay === '0'
  ) {
    return null
  }

  return (
    <PressableScale
      feedback="opacity"
      onPress={handleNavigation}
      className={ROW_CLASS}
    >
      {loadingMetadata ? (
        <View className="h-10 w-10 rounded-full bg-card" />
      ) : (
        <View className="relative">
          <TokenIcon img={image} />
          <View className="absolute -right-2 top-[-6px] h-[22px] w-[22px] items-center justify-center rounded-full bg-popover">
            <View className="h-[18px] w-[18px] items-center justify-center rounded-full bg-warning-500">
              <LockIcon size={12} colorClassName="accent-secondary" />
            </View>
          </View>
        </View>
      )}

      <View className="flex-1 px-4">
        {loadingAmount ? (
          <View className="flex-1 px-4">
            <View className="h-4 w-[120px] bg-card" />
            <View className="mt-2 h-4 w-[70px] bg-card" />
          </View>
        ) : (
          <View>
            <View className="flex-row items-center">
              <Text size="base" maxFontSizeMultiplier={1.3}>
                {`${balanceToDisplay} `}
              </Text>
              <Text
                className="font-medium text-muted-foreground"
                maxFontSizeMultiplier={1.3}
              >
                {symbol} (Locked)
              </Text>
            </View>
            <Text className="text-muted-foreground">-</Text>
          </View>
        )}
      </View>
      <Arrow colorClassName="accent-muted-foreground" />
    </PressableScale>
  )
}
