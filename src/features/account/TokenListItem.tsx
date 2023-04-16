import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import React, { useCallback, useMemo } from 'react'
import Arrow from '@assets/images/listItemRight.svg'
import { useNavigation } from '@react-navigation/native'
import Box from '@components/Box'
import FadeInOut from '@components/FadeInOut'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import TokenIcon from '@components/TokenIcon'
import useHaptic from '@hooks/useHaptic'
import { useMint, useTokenAccount } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import { BN } from 'bn.js'
import { toNumber } from '@helium/spl-utils'
import { useAppStorage } from '@storage/AppStorageProvider'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import { HomeNavigationProp } from '../home/homeTypes'

export const ITEM_HEIGHT = 72
type Props = {
  ticker: Ticker
  balance: Balance<AnyCurrencyType> | number
  staked?: boolean
  tokenAccount?: string
}
const TokenListItem = ({ ticker, balance, staked, tokenAccount }: Props) => {
  const navigation = useNavigation<HomeNavigationProp>()
  const { triggerImpact } = useHaptic()
  const { l1Network } = useAppStorage()
  const tokenAccountCache = useTokenAccount(
    tokenAccount ? new PublicKey(tokenAccount) : undefined,
  )
  const tokenAcountData = useMemo(() => {
    if (!tokenAccountCache.account) return
    return AccountLayout.decode(tokenAccountCache.account?.data)
  }, [tokenAccountCache])

  const { info: mint } = useMint(tokenAcountData?.mint)

  const handleNavigation = useCallback(() => {
    triggerImpact('light')
    navigation.navigate('AccountTokenScreen', { tokenType: ticker })
  }, [navigation, ticker, triggerImpact])

  const balanceToDisplay = useMemo(() => {
    if (l1Network === 'solana') {
      if (tokenAcountData) {
        if (ticker === 'DC') {
          return tokenAcountData.amount.toLocaleString()
        }

        return toNumber(
          new BN(tokenAcountData.amount.toString() || 0),
          mint?.info.decimals || 6,
        )
      }
      return balance?.toString(7, { showTicker: false }) || 0
    }
    return balance?.toString(7, { showTicker: false })
  }, [balance, mint, tokenAcountData, ticker, l1Network])

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
        <TokenIcon ticker={ticker} />
        <Box flex={1} paddingHorizontal="m">
          <Box flexDirection="row" alignItems="center">
            <Text
              variant="body1"
              color="primaryText"
              maxFontSizeMultiplier={1.3}
            >
              {balanceToDisplay}
            </Text>
            <Text
              variant="body2Medium"
              color="secondaryText"
              maxFontSizeMultiplier={1.3}
            >
              {` ${ticker}${staked ? ' Staked' : ''}`}
            </Text>
          </Box>
          <AccountTokenCurrencyBalance
            variant="subtitle4"
            color="secondaryText"
            ticker={ticker}
            staked={staked}
          />
        </Box>
        <Arrow />
      </TouchableContainer>
    </FadeInOut>
  )
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

export default TokenListItem
