import { Balance, Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import BN from 'bn.js'
import React, { memo } from 'react'
import RewardBG from '@assets/images/rewardBg.svg'
import { Theme } from '../theme/theme'
import Box from './Box'
import TokenIcon from './TokenIcon'
import Text from './Text'

type RewardItemProps = { ticker: Ticker; amount: BN } & BoxProps<Theme>

const RewardItem = ({ ticker, amount, ...rest }: RewardItemProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realAmount = Balance.fromIntAndTicker(new BN(amount) as any, ticker)

  return (
    <Box
      paddingVertical="l"
      paddingHorizontal="xl"
      justifyContent="center"
      alignItems="center"
      height={197}
      width={167}
      {...rest}
    >
      <Box position="absolute" top={0} right={0} bottom={0} left={0}>
        <RewardBG />
      </Box>

      <TokenIcon ticker={ticker} size={70} />

      <Text
        marginTop="m"
        variant="h3Medium"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {realAmount.bigBalance.toString()}
      </Text>
      <Text variant="subtitle3" color="secondaryText">
        {ticker}
      </Text>
    </Box>
  )
}

export default memo(RewardItem)
