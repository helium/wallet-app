import Pending from '@assets/images/pending.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PublicKey } from '@solana/web3.js'
import React, { memo, useCallback, useMemo } from 'react'
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
  const amt = useMemo(() => getAmount(), [getAmount])

  const handlePress = useCallback(() => {
    onPress(item)
  }, [item, onPress])

  return (
    <TouchableOpacityBox
      alignItems="center"
      borderBottomColor="primaryBackground"
      borderBottomWidth={isLast ? 1 : 0}
      flexDirection="row"
      onPress={handlePress}
    >
      <Box paddingRight="2">{listIcon}</Box>
      <Box flex={1} flexDirection="row">
        {item.pending && (
          <Box
            flex={1}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
          >
            <Pending />
          </Box>
        )}
        <Box justifyContent="center" paddingVertical="4" flex={1}>
          <Text variant="textSmRegular">{title}</Text>
          <Text variant="textSmRegular" color="gray.500">
            {time}
          </Text>
        </Box>
        <Box paddingVertical="4" maxWidth="55%">
          <Text variant="textSmRegular" color={color} textAlign="right">
            {amt}
          </Text>
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}

export default memo(TxnListItem)
