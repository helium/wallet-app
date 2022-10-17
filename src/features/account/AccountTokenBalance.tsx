import { BoxProps } from '@shopify/restyle'
import React, { memo, useMemo } from 'react'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { TokenType } from '../../generated/graphql'
import { Theme } from '../../theme/theme'
import { useBalance } from '../../utils/Balance'

type Props = {
  tokenType: TokenType
  textVariant?: 'h0' | 'h1' | 'h2'
  showTicker?: boolean
} & BoxProps<Theme>

const AccountTokenBalance = ({
  tokenType,
  textVariant,
  showTicker = true,
  ...boxProps
}: Props) => {
  const {
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
  } = useBalance()

  const balance = useMemo(() => {
    switch (tokenType) {
      default:
      case TokenType.Hnt: {
        if (networkBalance && networkStakedBalance)
          return networkBalance.plus(networkStakedBalance)

        if (networkBalance) return networkBalance
        return networkStakedBalance
      }
      case TokenType.Mobile:
        return mobileBalance
      case TokenType.Dc:
        return dcBalance
      case TokenType.Hst:
        return secBalance
    }
  }, [
    dcBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    tokenType,
  ])

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
