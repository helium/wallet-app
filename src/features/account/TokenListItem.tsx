import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import {
  useHeliumVsrState,
  usePositions,
  useRegistrarForMint,
} from '@helium/voter-stake-registry-hooks'
import { getPositionKeysForOwner } from '@helium/voter-stake-registry-sdk'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import usePrevious from '@hooks/usePrevious'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
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
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'

const Arrow = withUniwind(ChevronRight)
const LockIcon = withUniwind(Lock)
const WarningIcon = withUniwind(TriangleAlert)

const ROW_CLASS =
  'min-h-[72px] flex-row items-center border-b border-border px-4 py-4'

export const ITEM_HEIGHT = 72
type Props = {
  mint: PublicKey
}

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

export const TokenListItem = ({ mint }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const wallet = useCurrentWallet()
  const {
    amount,
    decimals,
    loading: loadingOwned,
  } = useOwnedAmount(wallet, mint)
  const { json, symbol, loading } = useMetaplexMetadata(mint)
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
      {loading ? (
        <View className="h-10 w-10 rounded-full bg-card" />
      ) : (
        <TokenIcon img={json?.image} />
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
            {symbol && (
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

export const TokenListGovItem = ({ mint }: { mint: PublicKey }) => {
  const navigation = useNavigation()
  const { connection } = useSolana()
  const wallet = useCurrentWallet()
  const { json, symbol, loading } = useMetaplexMetadata(mint)
  const decimals = useMint(mint)?.info?.decimals
  const mintStr = mint.toBase58()
  const {
    positions: contextPositions,
    mint: govMint,
    loading: loadingContext,
  } = useHeliumVsrState()
  const useContextPositions = !!govMint?.equals(mint)

  const { registrarKey } = useRegistrarForMint(mint)

  const registrarKeyStr = registrarKey?.toBase58()
  const walletStr = wallet?.toBase58()
  const args = walletStr &&
    connection &&
    registrarKeyStr && {
      registrar: new PublicKey(registrarKeyStr),
      owner: new PublicKey(walletStr),
      connection,
    }

  const { data: result, isLoading: loadingPositionKeys } = useQuery({
    queryKey: [
      'positionKeysForOwner',
      connection?.rpcEndpoint,
      registrarKey?.toBase58(),
      wallet?.toBase58(),
    ],
    queryFn: async () => (args ? getPositionKeysForOwner(args) : null),
    enabled: !!args && !useContextPositions,
    staleTime: 0,
  })

  const { accounts: fetchedPositions, loading: loadingFetchedPositions } =
    usePositions(result?.positions)
  const loadingPositions = loadingFetchedPositions || loadingContext
  const positions = useContextPositions
    ? contextPositions
    : fetchedPositions?.map((fetched) => fetched.info)

  const getAmountLocked = () => {
    if (positions && positions.length) {
      let amountLocked = new BN(0)
      positions.forEach((position) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (position && !position.isProxiedToMe) {
          amountLocked = amountLocked.add(position.amountDepositedNative)
        }
      })

      return amountLocked
    }

    return undefined
  }
  const amountLocked = getAmountLocked()

  const prevLocked = usePrevious(amountLocked)

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

  const loadingAmount = !prevLocked && (loadingPositionKeys || loadingPositions)

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
      {loading ? (
        <View className="h-10 w-10 rounded-full bg-card" />
      ) : (
        <View className="relative">
          <TokenIcon img={json?.image} />
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
