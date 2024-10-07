import Pending from '@assets/images/pending.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { PublicKey } from '@solana/web3.js'
import React, { memo, useCallback, useMemo } from 'react'
import { Activity } from '../../types/activity'
import useTxn from './useTxn'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'

type Props = {
  mint: PublicKey
  item: Activity
  now: Date
  isLast: boolean
  onPress: (item: Activity) => void
}
const TxnListItem = ({
  mint,
  item,
  now,
  isLast,
  onPress,
  ...rest
}: Props & BoxProps<Theme>) => {
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
      backgroundColor={'cardBackground'}
      borderBottomColor="primaryBackground"
      borderBottomWidth={isLast ? 0 : 2}
      flexDirection="row"
      onPress={handlePress}
      paddingHorizontal={'4'}
      paddingVertical={'3'}
      {...rest}
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
        <Box justifyContent="center" flex={1}>
          <Text variant="textSmRegular">{title}</Text>
          <Text variant="textSmRegular" color="gray.500">
            {time}
          </Text>
        </Box>
        <Box flex={1} justifyContent={'center'}>
          <Text variant="textSmRegular" color={color} textAlign="right">
            {amt}
          </Text>
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}

export default memo(TxnListItem)
