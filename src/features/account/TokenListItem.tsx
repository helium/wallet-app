/* eslint-disable @typescript-eslint/no-shadow */
import Arrow from '@assets/images/listItemRight.svg'
import Lock from '@assets/images/lockClosed.svg'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import {
  useHeliumVsrState,
  usePositions,
  useRegistrarForMint,
} from '@helium/voter-stake-registry-hooks'
import { getPositionKeysForOwner } from '@helium/voter-stake-registry-sdk'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import usePrevious from '@hooks/usePrevious'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useColors } from '@theme/themeHooks'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { ServiceSheetNavigationProp } from '@services/serviceSheetTypes'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import useAmountLocked from '@hooks/useAmountLocked'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import { useSolana } from '../../solana/SolanaProvider'

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
        paddingHorizontal="6"
        borderBottomColor="primaryBackground"
        borderBottomWidth={1}
      >
        <Box
          width={40}
          height={40}
          borderRadius="full"
          backgroundColor="cardBackground"
        />
        <Box flex={1} paddingHorizontal="4">
          <Box width={120} height={16} backgroundColor="cardBackground" />
          <Box
            width={70}
            height={16}
            marginTop="2"
            backgroundColor="cardBackground"
          />
        </Box>
        <Arrow width={4} height={4} />
      </Box>
    </FadeInOut>
  )
}

export const TokenListItem = ({ mint }: Props) => {
  const navigation = useNavigation<WalletNavigationProp>()
  const wallet = useCurrentWallet()
  const {
    amount,
    decimals,
    loading: loadingOwned,
  } = useOwnedAmount(wallet, mint)

  const { triggerImpact } = useHaptic()
  const { json, symbol, loading } = useMetaplexMetadata(mint)
  const mintStr = mint.toBase58()

  const handleNavigation = useCallback(() => {
    triggerImpact('light')
    navigation.navigate('AccountTokenScreen', {
      mint: mintStr,
    })
  }, [navigation, mintStr, triggerImpact])

  const balanceToDisplay = useMemo(() => {
    return amount && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amount.toString()), decimals)
      : '0'
  }, [amount, decimals])

  return (
    <FadeInOut>
      <TouchableContainer
        onPress={handleNavigation}
        flexDirection="row"
        minHeight={ITEM_HEIGHT}
        alignItems="center"
        paddingHorizontal="4"
        paddingVertical="4"
        backgroundColor="primaryBackground"
        backgroundColorPressed="bg.primary-hover"
      >
        {loading ? (
          <Box
            width={40}
            height={40}
            borderRadius="full"
            backgroundColor="fg.quinary-400"
          />
        ) : (
          <TokenIcon img={json?.image} />
        )}

        <Box flex={1} paddingHorizontal="4">
          {loadingOwned ? (
            <Box flex={1} paddingHorizontal="4">
              <Box width={120} height={16} backgroundColor="fg.quinary-400" />
              <Box
                width={70}
                height={16}
                marginTop="2"
                backgroundColor="fg.quinary-400"
              />
            </Box>
          ) : (
            <Box>
              <Text
                variant="textMdRegular"
                color="text.tertiary-600"
                maxFontSizeMultiplier={1.3}
              >
                {json?.name}
              </Text>
              <Box flexDirection="row" alignItems="flex-end" gap="1">
                <Text
                  variant="textMdRegular"
                  color="text.tertiary-600"
                  maxFontSizeMultiplier={1.3}
                >
                  {`${balanceToDisplay}`}
                </Text>
                <Text
                  variant="textSmMedium"
                  color="text.tertiary-600"
                  maxFontSizeMultiplier={1.3}
                >
                  {symbol}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
        <Box flexDirection="column" alignItems="flex-end">
          {symbol && (
            <AccountTokenCurrencyBalance
              variant="textSmMedium"
              color="secondaryText"
              ticker={symbol.toUpperCase()}
            />
          )}
          {/* 
          TODO: Bring this back once we are tracking balances on the wallet api 
          <PercentChange change={120.0} type="up" /> */}
        </Box>
      </TouchableContainer>
    </FadeInOut>
  )
}

export const HeliumTokenListItem = ({ mint }: Props) => {
  const navigation = useNavigation<WalletNavigationProp>()
  const wallet = useCurrentWallet()
  const {
    amount,
    decimals,
    loading: loadingOwned,
  } = useOwnedAmount(wallet, mint)
  const { triggerImpact } = useHaptic()
  const { json, symbol, loading } = useMetaplexMetadata(mint)
  const mintStr = mint.toBase58()
  const { amountLocked } = useAmountLocked(mint)

  const handleNavigation = useCallback(() => {
    triggerImpact('light')
    navigation.navigate('AccountTokenScreen', {
      mint: mintStr,
    })
  }, [navigation, mintStr, triggerImpact])

  const balanceToDisplay = useMemo(() => {
    let realAmount = new BN(0)
    if (amountLocked) {
      realAmount = realAmount.add(amountLocked)
    }

    if (amount) {
      const amountAsBN = new BN(amount.toString())
      realAmount = realAmount.add(amountAsBN)
    }

    return realAmount && typeof decimals !== 'undefined'
      ? humanReadable(realAmount, decimals)
      : '0'
  }, [amount, decimals, amountLocked])

  return (
    <FadeInOut>
      <TouchableContainer
        onPress={handleNavigation}
        flexDirection="row"
        minHeight={ITEM_HEIGHT}
        alignItems="center"
        paddingHorizontal="4"
        paddingVertical="4"
        backgroundColor="primaryBackground"
        backgroundColorPressed="bg.primary-hover"
      >
        {loading ? (
          <Box
            width={40}
            height={40}
            borderRadius="full"
            backgroundColor="fg.quinary-400"
          />
        ) : (
          <TokenIcon img={json?.image} />
        )}

        <Box flex={1} paddingHorizontal="4">
          {loadingOwned ? (
            <Box flex={1} paddingHorizontal="4">
              <Box width={120} height={16} backgroundColor="fg.quinary-400" />
              <Box
                width={70}
                height={16}
                marginTop="2"
                backgroundColor="fg.quinary-400"
              />
            </Box>
          ) : (
            <Box>
              <Text
                variant="textMdRegular"
                color="text.tertiary-600"
                maxFontSizeMultiplier={1.3}
              >
                {json?.name}
              </Text>
              <Box flexDirection="row" alignItems="flex-end" gap="1">
                <Text
                  variant="textMdRegular"
                  color="text.tertiary-600"
                  maxFontSizeMultiplier={1.3}
                >
                  {`${balanceToDisplay}`}
                </Text>
                <Text
                  variant="textSmMedium"
                  color="text.tertiary-600"
                  maxFontSizeMultiplier={1.3}
                >
                  {symbol}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
        <Box flexDirection="column" alignItems="flex-end">
          {symbol && (
            <AccountTokenCurrencyBalance
              variant="textSmMedium"
              color="secondaryText"
              ticker={symbol.toUpperCase()}
            />
          )}
          {/* 
          TODO: Bring this back once we are tracking balances on the wallet api 
          <PercentChange change={120.0} type="up" /> */}
        </Box>
      </TouchableContainer>
    </FadeInOut>
  )
}

// TODO: Bring back once we add chart history back to the wallet api
// const PercentChange = ({
//   change,
//   type,
// }: {
//   change: number
//   type: 'up' | 'down' | 'neutral'
// }) => {
//   const color = useMemo(() => {
//     switch (type) {
//       case 'up':
//         return 'green.light-500'
//       case 'down':
//         return 'blue.dark-600'
//       case 'neutral':
//         return 'fg.quinary-400'
//     }
//   }, [type])

//   const prefix = useMemo(() => {
//     return change > 0 ? '+' : '-'
//   }, [change])

//   return (
//     <Text adjustsFontSizeToFit variant="textSmMedium" color={color}>
//       {`${prefix}${change.toFixed(2).toLocaleString()}%`}
//     </Text>
//   )
// }

export const TokenListGovItem = ({
  mint,
  ...rest
}: { mint: PublicKey } & BoxProps<Theme>) => {
  const navigation = useNavigation<ServiceSheetNavigationProp>()
  const { anchorProvider, connection } = useSolana()
  const wallet = useCurrentWallet()
  const { triggerImpact } = useHaptic()
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

  const args = useMemo(
    () =>
      wallet &&
      mint &&
      connection &&
      registrarKey && {
        registrar: registrarKey,
        owner: wallet,
        connection,
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      registrarKey?.toBase58(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      wallet?.toBase58(),
      connection,
      anchorProvider,
    ],
  )

  const { result, loading: loadingPositionKeys } = useAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any | undefined, useContext: boolean) => {
      if (args && !useContext) {
        return getPositionKeysForOwner(args)
      }
    },
    [args, useContextPositions],
  )

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
    triggerImpact('light')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigation as any).navigate('GovernanceService', {
      screen: 'PositionsScreen',
      initial: false,
      params: { mint: mintStr },
    })
  }, [navigation, mintStr, triggerImpact])

  const balanceToDisplay = useMemo(() => {
    return amountLocked && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amountLocked.toString()), decimals)
      : '0'
  }, [amountLocked, decimals])

  const loadingAmount = useMemo(() => {
    return !prevLocked && (loadingPositionKeys || loadingPositions)
  }, [loadingPositionKeys, loadingPositions, prevLocked])

  if (balanceToDisplay === '0') return null

  return (
    <TouchableContainer
      onPress={handleNavigation}
      flexDirection="row"
      minHeight={ITEM_HEIGHT}
      alignItems="center"
      padding="4"
      backgroundColor="cardBackground"
      backgroundColorPressed="bg.primary-hover"
      borderRadius="2xl"
      {...rest}
    >
      {loading ? (
        <Box
          width={40}
          height={40}
          borderRadius="full"
          backgroundColor="cardBackground"
        />
      ) : (
        <Box position="relative">
          <TokenIcon img={json?.image} />
          <Box
            position="absolute"
            top={-6}
            right={-8}
            backgroundColor="cardBackground"
            justifyContent="center"
            borderRadius="full"
            alignItems="center"
            height={22}
            width={22}
          >
            <Box
              backgroundColor="orange.500"
              borderRadius="full"
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

      <Box flex={1} paddingHorizontal="4">
        {loadingAmount ? (
          <Box flex={1} paddingHorizontal="4">
            <Box width={120} height={16} backgroundColor="cardBackground" />
            <Box
              width={70}
              height={16}
              marginTop="2"
              backgroundColor="cardBackground"
            />
          </Box>
        ) : (
          <Box>
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
                {symbol} (Locked)
              </Text>
            </Box>
          </Box>
        )}
      </Box>
      <Arrow />
    </TouchableContainer>
  )
}
