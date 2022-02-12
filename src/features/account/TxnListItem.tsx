import React, { memo, useCallback } from 'react'
import { useAsync } from 'react-async-hook'
import Pending from '@assets/images/pending.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { Activity } from '../../generated/graphql'
import useTxn from './useTxn'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'

type Props = {
  item: Activity
  accountAddress?: string
  now: Date
  isLast: boolean
  onPress: (item: Activity) => void
}
const TxnListItem = ({ item, accountAddress, now, isLast, onPress }: Props) => {
  const {
    listIcon,
    title,
    color,
    time,
    memo: txnMemo,
    amount,
  } = useTxn(item, accountAddress || '', { now })
  const { result: amt } = useAsync(amount, [])

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
      <Box paddingLeft="l" paddingRight="s">
        {listIcon}
      </Box>
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
        <Box flex={1} justifyContent="center" paddingVertical="m">
          <Text variant="body2">{title}</Text>
          <Text variant="body2" color="grey500">
            {time}
          </Text>
        </Box>
        <Box paddingEnd="l" paddingVertical="m">
          <Text variant="body2" color={color} textAlign="right">
            {amt}
          </Text>
          <Text variant="body2" color="grey500" textAlign="right">
            {txnMemo}
          </Text>
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}

export default memo(TxnListItem)
