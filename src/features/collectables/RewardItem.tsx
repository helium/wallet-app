import React from 'react'
import { BoxProps } from '@shopify/restyle'
import { toNumber } from '@helium/spl-utils'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import Box from '../../components/Box'
import { Theme } from '../../theme/theme'
import { formatLargeNumber } from '../../utils/accountUtils'
import TokenIcon from '../../components/TokenIcon'
import Text from '../../components/Text'

type Props = BoxProps<Theme> & {
  decimals?: number
  amount?: BN
  ticker: 'MOBILE' | 'IOT'
}
const RewardItem = ({ amount, decimals, ticker, ...rest }: Props) => {
  let realAmount = ''
  if (amount) {
    const num = toNumber(amount || 0n, decimals || 6)
    realAmount = formatLargeNumber(new BigNumber(num))
  }

  return (
    <Box
      padding="m"
      alignItems="center"
      justifyContent="center"
      backgroundColor="secondaryBackground"
      borderRadius="xl"
      flex={1}
      flexDirection="row"
      {...rest}
    >
      <TokenIcon ticker={ticker} size={30} />

      <Box marginStart="s">
        <Text
          marginTop="xs"
          variant="subtitle3"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.1}
        >
          {realAmount}
        </Text>
        <Text variant="subtitle4" color="secondaryText">
          {ticker}
        </Text>
      </Box>
    </Box>
  )
}
export default RewardItem
