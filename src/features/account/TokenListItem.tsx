/* eslint-disable @typescript-eslint/no-shadow */
import Arrow from '@assets/images/listItemRight.svg'
import InfoWarning from '@assets/images/warning.svg'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useNavigation } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { MIN_BALANCE_THRESHOLD } from '@utils/constants'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import {
  getPositionKeys,
  usePositions,
} from '@helium/voter-stake-registry-hooks'
import { useAsync } from 'react-async-hook'
import usePrevious from '@hooks/usePrevious'
import Lock from '@assets/images/lock.svg'
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
          )}
          {symbol && (
            <AccountTokenCurrencyBalance
              variant="subtitle4"
              color="secondaryText"
              ticker={symbol.toUpperCase()}
            />
          )}
        </Box>
        {mint.equals(NATIVE_MINT) && (amount || 0) < MIN_BALANCE_THRESHOLD && (
          <Box mr="m">
            <InfoWarning width={28} height={28} />
          </Box>
        )}
        <Arrow />
      </TouchableContainer>
    </FadeInOut>
  )
}

export const TokenListGovItem = ({ mint }: { mint: PublicKey }) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { anchorProvider, connection } = useSolana()
  const wallet = useCurrentWallet()
  const { triggerImpact } = useHaptic()
  const { json, symbol, loading } = useMetaplexMetadata(mint)
  const decimals = useMint(mint)?.info?.decimals
  const mintStr = mint.toBase58()

  const args = useMemo(
    () =>
      wallet &&
      mint &&
      connection && {
        wallet: anchorProvider?.wallet.publicKey,
        mint,
        provider: anchorProvider,
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mint],
  )

  const {
    result,
    loading: loadingPositionKeys,
    error,
  } = useAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any | undefined) => {
      if (args) {
        return getPositionKeys(args)
      }
    },
    [args],
  )

  const { accounts: positions, loading: loadingPositions } = usePositions(
    result?.positionKeys,
  )

  const { amountLocked } = useMemo(() => {
    if (positions) {
      let amountLocked = new BN(0)
      positions.forEach((position) => {
        if (position && position.info) {
          amountLocked = amountLocked.add(position.info.amountDepositedNative)
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
    navigation.navigate('AccountTokenScreen', {
      mint: mintStr,
    })
  }, [navigation, mintStr, triggerImpact])

  const balanceToDisplay = useMemo(() => {
    return amountLocked && typeof decimals !== 'undefined'
      ? humanReadable(new BN(amountLocked.toString()), decimals)
      : '0'
  }, [amountLocked, decimals])

  return (
    <FadeInOut>
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
              justifyContent="center"
              alignItems="center"
              top={-4}
              right={-6}
              backgroundColor="black"
              borderRadius="round"
              height={20}
              width={20}
            >
              <Box
                backgroundColor="grey900"
                borderRadius="round"
                height={16}
                width={16}
                justifyContent="center"
                alignItems="center"
              >
                <Lock width={10} height={10} color="white" />
              </Box>
            </Box>
          </Box>
        )}

        <Box flex={1} paddingHorizontal="m">
          {prevLocked === undefined &&
          (loadingPositionKeys || loadingPositions) ? (
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
          )}
          {symbol && (
            <AccountTokenCurrencyBalance
              variant="subtitle4"
              color="secondaryText"
              ticker={symbol.toUpperCase()}
            />
          )}
        </Box>
        <Arrow />
      </TouchableContainer>
    </FadeInOut>
  )
}
