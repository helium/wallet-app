import React, { memo } from 'react'
import { useAsync } from 'react-async-hook'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { AccountActivity_accountActivity_data } from '../../graphql/__generated__/AccountActivity'
import useTxn from './useTxn'

type Props = {
  item: AccountActivity_accountActivity_data
  accountAddress?: string
  now: Date
}
const TxnListItem = ({ item, accountAddress, now }: Props) => {
  const {
    listIcon,
    title,
    color,
    time,
    memo: txnMemo,
    amount,
  } = useTxn(item, accountAddress || '', { now })
  const { result: amt } = useAsync(amount, [])
  return (
    <Box
      alignItems="center"
      flexDirection="row"
      paddingHorizontal="l"
      paddingVertical="m"
    >
      {listIcon}
      <Box flex={1} marginLeft="s">
        <Text variant="body2">{title}</Text>
        <Text variant="body2" color="grey500">
          {time}
        </Text>
      </Box>
      <Box>
        <Text variant="body2" color={color} textAlign="right">
          {amt}
        </Text>
        <Text variant="body2" color="grey500" textAlign="right">
          {txnMemo}
        </Text>
      </Box>
    </Box>
  )
}

export default memo(TxnListItem)
