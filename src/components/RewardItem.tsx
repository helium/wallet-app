import RewardBG from '@assets/images/rewardBg.svg'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@theme/theme'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { memo, useMemo } from 'react'
import Box from './Box'
import Text from './Text'
import TokenIcon from './TokenIcon'

type RewardItemProps = {
  mint: PublicKey
  amount: BN
  hasMore: boolean
} & BoxProps<Theme>

const RewardItem = ({ mint, amount, hasMore, ...rest }: RewardItemProps) => {
  const decimals = useMint(mint)?.info?.decimals
  const { json, symbol } = useMetaplexMetadata(mint)
  const pendingRewardsString = useMemo(() => {
    if (!amount) return

    return `${humanReadable(amount, decimals || 6)}${hasMore ? '+' : ''}`
  }, [amount, decimals, hasMore])

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

      <TokenIcon img={json?.image} size={70} />

      <Text
        marginTop="m"
        variant="h3Medium"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {pendingRewardsString}
      </Text>
      <Text variant="subtitle3" color="secondaryText">
        {symbol}
      </Text>
    </Box>
  )
}

export default memo(RewardItem)
