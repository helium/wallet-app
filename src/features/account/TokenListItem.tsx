import Arrow from '@assets/images/listItemRight.svg'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import TouchableContainer from '@components/TouchableContainer'
import { Ticker } from '@helium/currency'
import { useOwnedAmount } from '@helium/helium-react-hooks'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useCallback, useMemo } from 'react'
import { HomeNavigationProp } from '../home/homeTypes'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'

export const ITEM_HEIGHT = 72
type Props = {
  mint: PublicKey
}
const TokenListItem = ({ mint }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const wallet = usePublicKey(currentAccount?.solanaAddress)
  const {
    amount,
    decimals,
    loading: loadingOwned,
  } = useOwnedAmount(wallet, mint)
  // const amount = BigInt(0)
  // const decimals = 0
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
              ticker={symbol.toUpperCase() as Ticker}
            />
          )}
        </Box>
        <Arrow />
      </TouchableContainer>
    </FadeInOut>
  )
}

export default TokenListItem

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
