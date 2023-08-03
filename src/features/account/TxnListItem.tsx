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
      <Box paddingRight="s">{listIcon}</Box>
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
        <Box justifyContent="center" paddingVertical="m" flex={1}>
          <Text variant="body2">{title}</Text>
          <Text variant="body2" color="grey500">
            {time}
          </Text>
        </Box>
        <Box paddingVertical="m" maxWidth="55%">
          <Text variant="body2" color={color} textAlign="right">
            {amt}
          </Text>
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}

export default memo(TxnListItem)
