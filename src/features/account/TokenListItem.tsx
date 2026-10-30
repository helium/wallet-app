/* eslint-disable @typescript-eslint/no-shadow */
import Arrow from '@assets/images/listItemRight.svg'
import Lock from '@assets/images/lockClosed.svg'
import InfoWarning from '@assets/images/warning.svg'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
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
import { useColors } from '@theme/themeHooks'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { useSolana } from '../../solana/SolanaProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'

export const ITEM_HEIGHT = 72
type Props = {
  mint: PublicKey
}

export const TokenSkeleton = () => {
  return (
    <FadeInOut>
      <Box
        flexDirection="row"
        height={ITEM_HEIGHT}
        alignItems="center"
        paddingHorizontal="l"
        borderBottomColor="primaryBackground"
        borderBottomWidth={1}
      >
        <Box
          width={40}
          height={40}
          borderRadius="round"
          backgroundColor="surface"
        />
        <Box flex={1} paddingHorizontal="m">
          <Box width={120} height={16} backgroundColor="surface" />
          <Box width={70} height={16} marginTop="s" backgroundColor="surface" />
        </Box>
        <Arrow width={4} height={4} />
      </Box>
    </FadeInOut>
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

  const handleNavigation = useCallback(() => {
    navigation.navigate('AccountTokenScreen', {
      mint: mintStr,
    })
  }, [navigation, mintStr])

  const balanceToDisplay = useMemo(() => {
    return amount && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amount.toString()), decimals)
      : '0'
  }, [amount, decimals])

  if (
    (mint.equals(MOBILE_MINT) || mint.equals(IOT_MINT)) &&
    balanceToDisplay === '0'
  ) {
    return null
  }

  return (
    <TouchableContainer
      testID={`TokenListItem.${symbol}`}
      onPress={handleNavigation}
      flexDirection="row"
      minHeight={ITEM_HEIGHT}
      alignItems="center"
      paddingHorizontal="m"
      paddingVertical="m"
      borderBottomColor="primaryBackground"
      borderBottomWidth={1}
    >
      {loading ? (
        <Box
          width={40}
          height={40}
          borderRadius="round"
          backgroundColor="surface"
        />
      ) : (
        <TokenIcon img={json?.image} />
      )}

      <Box flex={1} paddingHorizontal="m">
        {loadingOwned ? (
          <Box flex={1} paddingHorizontal="m">
            <Box width={120} height={16} backgroundColor="surface" />
            <Box
              width={70}
              height={16}
              marginTop="s"
              backgroundColor="surface"
            />
          </Box>
        ) : (
          <Box>
            <Box flexDirection="row" alignItems="center">
              <Text
                variant="body1"
                color="primaryText"
                maxFontSizeMultiplier={1.3}
              >
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
        )}
      </Box>
      {mint.equals(NATIVE_MINT) && (amount || 0) < MIN_BALANCE_THRESHOLD && (
        <Box mr="m">
          <InfoWarning width={28} height={28} />
        </Box>
      )}
      <Arrow />
    </TouchableContainer>
  )
}

export const TokenListGovItem = ({ mint }: { mint: PublicKey }) => {
  const navigation = useNavigation()
  const { connection } = useSolana()
  const wallet = useCurrentWallet()
  const { json, symbol, loading } = useMetaplexMetadata(mint)
  const decimals = useMint(mint)?.info?.decimals
  const mintStr = mint.toBase58()
  const colors = useColors()
  const {
    positions: contextPositions,
    mint: govMint,
    loading: loadingContext,
  } = useHeliumVsrState()
  const useContextPositions = useMemo(
    () => !!govMint?.equals(mint),
    [govMint, mint],
  )

  const { registrarKey } = useRegistrarForMint(mint)

  const registrarKeyStr = registrarKey?.toBase58()
  const walletStr = wallet?.toBase58()
  const args = useMemo(
    () =>
      walletStr &&
      connection &&
      registrarKeyStr && {
        registrar: new PublicKey(registrarKeyStr),
        owner: new PublicKey(walletStr),
        connection,
      },
    [registrarKeyStr, walletStr, connection],
  )

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
  const positions = useMemo(
    () =>
      useContextPositions
        ? contextPositions
        : fetchedPositions?.map((fetched) => fetched.info),
    [useContextPositions, contextPositions, fetchedPositions],
  )

  const { amountLocked } = useMemo(() => {
    if (positions && positions.length) {
      let amountLocked = new BN(0)
      positions.forEach((position) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (position && !position.isProxiedToMe) {
          amountLocked = amountLocked.add(position.amountDepositedNative)
        }
      })

      return {
        amountLocked,
      }
    }

    return {}
  }, [positions])

  const prevLocked = usePrevious(amountLocked)

  const handleNavigation = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigation as any).navigate('Governance', {
      screen: 'PositionsScreen',
      initial: false,
      params: { mint: mintStr },
    })
  }, [navigation, mintStr])

  const balanceToDisplay = useMemo(() => {
    return amountLocked && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amountLocked.toString()), decimals)
      : '0'
  }, [amountLocked, decimals])

  const loadingAmount = useMemo(() => {
    return !prevLocked && (loadingPositionKeys || loadingPositions)
  }, [loadingPositionKeys, loadingPositions, prevLocked])

  if (
    (mint.equals(MOBILE_MINT) || mint.equals(IOT_MINT)) &&
    balanceToDisplay === '0'
  ) {
    return null
  }

  return (
    <TouchableContainer
      onPress={handleNavigation}
      flexDirection="row"
      minHeight={ITEM_HEIGHT}
      alignItems="center"
      paddingHorizontal="m"
      paddingVertical="m"
      borderBottomColor="primaryBackground"
      borderBottomWidth={1}
    >
      {loading ? (
        <Box
          width={40}
          height={40}
          borderRadius="round"
          backgroundColor="surface"
        />
      ) : (
        <Box position="relative">
          <TokenIcon img={json?.image} />
          <Box
            position="absolute"
            top={-6}
            right={-8}
            backgroundColor="bottomSheetBg"
            justifyContent="center"
            borderRadius="round"
            alignItems="center"
            height={22}
            width={22}
          >
            <Box
              backgroundColor="orange500"
              borderRadius="round"
              justifyContent="center"
              alignItems="center"
              height={18}
              width={18}
            >
              <Lock width={12} height={12} color={colors.secondaryBackground} />
            </Box>
          </Box>
        </Box>
      )}

      <Box flex={1} paddingHorizontal="m">
        {loadingAmount ? (
          <Box flex={1} paddingHorizontal="m">
            <Box width={120} height={16} backgroundColor="surface" />
            <Box
              width={70}
              height={16}
              marginTop="s"
              backgroundColor="surface"
            />
          </Box>
        ) : (
          <Box>
            <Box flexDirection="row" alignItems="center">
              <Text
                variant="body1"
                color="primaryText"
                maxFontSizeMultiplier={1.3}
              >
                {`${balanceToDisplay} `}
              </Text>
              <Text
                variant="body2Medium"
                color="secondaryText"
                maxFontSizeMultiplier={1.3}
              >
                {symbol} (Locked)
              </Text>
            </Box>
            <Text color="secondaryText">-</Text>
          </Box>
        )}
      </Box>
      <Arrow />
    </TouchableContainer>
  )
}
