import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { AccountData, TokenType } from '../../generated/graphql'
import { Theme } from '../../theme/theme'
import { useAccountBalances } from '../../utils/Balance'

type Props = {
  accountData?: AccountData | null
  tokenType: TokenType
  textVariant?: 'h0' | 'h1' | 'h2'
  showTicker?: boolean
} & BoxProps<Theme>

const AccountTokenBalance = ({
  accountData,
  tokenType,
  textVariant,
  showTicker = true,
  ...boxProps
}: Props) => {
  const balances = useAccountBalances(accountData)

  const balance = useMemo(() => {
    switch (tokenType) {
      default:
      case TokenType.Hnt:
        return balances?.hnt
      case TokenType.Mobile:
        return balances?.mobile
      case TokenType.Dc:
        return balances?.dc
      case TokenType.Hst:
        return balances?.hst
    }
  }, [balances, tokenType])

  return (
    <Box flexDirection="row" justifyContent="center" {...boxProps}>
      <Text
        variant={textVariant || 'h1'}
        color="primaryText"
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        adjustsFontSizeToFit
      >
        {`${balance?.toString(2, { showTicker: false })} `}
      </Text>
      {showTicker && (
        <Text
          variant={textVariant || 'h1'}
          color="secondaryText"
          numberOfLines={1}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
        >
          {balance?.type.ticker}
        </Text>
      )}
    </Box>
  )
}

export default memo(AccountTokenBalance)
