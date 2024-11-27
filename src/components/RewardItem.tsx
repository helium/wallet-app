import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Theme } from '@config/theme/theme'
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
      backgroundColor="cardBackground"
      borderRadius="2xl"
      paddingVertical="6"
      paddingHorizontal="8"
      justifyContent="center"
      alignItems="center"
      height={197}
      width={167}
      {...rest}
    >
      <TokenIcon img={json?.image} size={70} />

      <Text
        marginTop="4"
        variant="displayXsMedium"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {pendingRewardsString}
      </Text>
      <Text variant="textMdMedium" color="secondaryText">
        {symbol}
      </Text>
    </Box>
  )
}

export default memo(RewardItem)
