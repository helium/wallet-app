import Pending from '@assets/images/pending.svg'
import { PublicKey } from '@solana/web3.js'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import React from 'react'
import { View } from 'react-native'
import { Activity } from '../../types/activity'
import useTxn from './useTxn'

type Props = {
  mint: PublicKey
  item: Activity
  now: Date
  isLast: boolean
  onPress: (item: Activity) => void
}
const TxnListItem = ({ mint, item, now, isLast, onPress }: Props) => {
  const { listIcon, title, color, time, getAmount } = useTxn(mint, item, {
    now,
  })
  const amt = getAmount()

  return (
    <PressableScale
      feedback="opacity"
      className={twMerge(
        'flex-row items-center border-border',
        isLast && 'border-b',
      )}
      onPress={() => onPress(item)}
    >
      <View className="pr-2">{listIcon}</View>
      <View className="flex-1 flex-row">
        {item.pending && (
          <View className="absolute inset-0 flex-1">
            <Pending />
          </View>
        )}
        <View className="flex-1 justify-center py-4">
          <Text>{title}</Text>
          <Text className="text-muted-foreground">{time}</Text>
        </View>
        <View className="max-w-[55%] py-4">
          <Text className={twMerge('text-right', color)}>{amt}</Text>
        </View>
      </View>
    </PressableScale>
  )
}

export default TxnListItem
