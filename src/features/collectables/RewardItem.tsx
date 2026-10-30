import RewardBG from '@assets/images/rewardBg.svg'
import { useMint } from '@helium/helium-react-hooks'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { PublicKey } from '@solana/web3.js'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { twMerge } from '@ui/twMerge'
import { humanReadable } from '@utils/solanaUtils'
import BN from 'bn.js'
import React from 'react'
import { View } from 'react-native'

type RewardItemProps = {
  mint: PublicKey
  amount: BN
  hasMore: boolean
  className?: string
}

const RewardItem = ({ mint, amount, hasMore, className }: RewardItemProps) => {
  const decimals = useMint(mint)?.info?.decimals
  const { json, symbol } = useMetaplexMetadata(mint)
  const pendingRewardsString = amount
    ? `${humanReadable(amount, decimals || 6)}${hasMore ? '+' : ''}`
    : undefined

  return (
    <View
      className={twMerge(
        'h-[197px] w-[167px] items-center justify-center px-8 py-6',
        className,
      )}
    >
      <View className="absolute inset-0">
        <RewardBG />
      </View>

      <TokenIcon img={json?.image} size={70} />

      <Text
        size="2xl"
        className="mt-4 font-medium"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {pendingRewardsString}
      </Text>
      <Text size="base" className="font-medium text-muted-foreground">
        {symbol}
      </Text>
    </View>
  )
}

export default RewardItem
