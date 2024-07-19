import Box from '@components/Box'
import Text from '@components/Text'
import React, { ReactNode } from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'
import {
  WalletSignOptsCommon,
  WalletSignOptsCompact,
} from './walletSignBottomSheetTypes'

interface IWalletSignBottomSheetCompactProps
  extends WalletSignOptsCommon,
    WalletSignOptsCompact {
  children?: ReactNode
}

export const WalletSignBottomSheetCompact = ({
  header,
  message,
  onSimulate,
  onCancelHandler,
  onAcceptHandler,
  children,
}: IWalletSignBottomSheetCompactProps) => (
  <Box
    padding="l"
    backgroundColor="white"
    borderRadius="xl"
    marginBottom="m"
    alignItems="center"
  >
    <Text variant="h3" marginBottom="s">
      {header}
    </Text>
    <Text variant="body1" textAlign="center" marginBottom="l">
      {message}
    </Text>
    <TouchableOpacity onPress={onSimulate}>
      <Text variant="body1" color="secondaryText">
        Simulate Transaction
      </Text>
    </TouchableOpacity>
    {children}
  </Box>
)
