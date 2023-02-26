import { Ticker } from '@helium/currency'
import { BoxProps } from '@shopify/restyle'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import RewardBG from '@assets/images/rewardBg.svg'
import { Theme } from '@theme/theme'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { useMint } from '@helium/helium-react-hooks'
import { formatLargeNumber } from '@utils/accountUtils'
import BigNumber from 'bignumber.js'
import Box from './Box'
import TokenIcon from './TokenIcon'
import Text from './Text'

type RewardItemProps = { ticker: Ticker; amount: BN } & BoxProps<Theme>

const RewardItem = ({ ticker, amount, ...rest }: RewardItemProps) => {
  const { info: iotMint } = useMint(IOT_MINT)
  const { info: mobileMint } = useMint(MOBILE_MINT)

  const pendingRewardsString = useMemo(() => {
    if (!amount) return

    const decimals =
      ticker === 'MOBILE' ? mobileMint?.info.decimals : iotMint?.info.decimals
    const num = toNumber(amount, decimals || 6)
    return formatLargeNumber(new BigNumber(num))
  }, [mobileMint, iotMint, amount, ticker])

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
        {pendingRewardsString}
      </Text>
      <Text variant="subtitle3" color="secondaryText">
        {ticker}
      </Text>
    </Box>
  )
}

export default memo(RewardItem)
