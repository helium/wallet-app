import Balance, { AnyCurrencyType, Ticker } from '@helium/currency'
import React, { useCallback } from 'react'
import Arrow from '@assets/images/listItemRight.svg'
import { useNavigation } from '@react-navigation/native'
import Box from '../../components/Box'
import FadeInOut from '../../components/FadeInOut'
import Text from '../../components/Text'
import TouchableContainer from '../../components/TouchableContainer'
import AccountTokenCurrencyBalance from './AccountTokenCurrencyBalance'
import TokenIcon from '../../components/TokenIcon'
import { HomeNavigationProp } from '../home/homeTypes'
import useHaptic from '../../hooks/useHaptic'

export const ITEM_HEIGHT = 72
type Props = {
  ticker: Ticker
  balance: Balance<AnyCurrencyType>
  staked?: boolean
}
const TokenListItem = ({ ticker, balance, staked }: Props) => {
  const disabled = ticker === 'SOL' || ticker === 'IOT'
  const navigation = useNavigation<HomeNavigationProp>()
  const { triggerImpact } = useHaptic()

  const handleNavigation = useCallback(() => {
    if (ticker === 'SOL') {
      return
    }
    triggerImpact('light')
    navigation.navigate('AccountTokenScreen', { tokenType: ticker })
  }, [navigation, ticker, triggerImpact])

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
        disabled={disabled}
      >
        <TokenIcon ticker={ticker} />
        <Box flex={1} paddingHorizontal="m">
          <Box flexDirection="row" alignItems="center">
            <Text
              variant="body1"
              color="primaryText"
              maxFontSizeMultiplier={1.3}
            >
              {balance?.toString(7, { showTicker: false })}
            </Text>
            <Text
              variant="body2Medium"
              color="secondaryText"
              maxFontSizeMultiplier={1.3}
            >
              {` ${balance?.type.ticker}${staked ? ' Staked' : ''}`}
            </Text>
          </Box>
          <AccountTokenCurrencyBalance
            variant="subtitle4"
            color="secondaryText"
            ticker={ticker}
            staked={staked}
          />
        </Box>
        {!disabled && <Arrow />}
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
