import React, { memo, useMemo } from 'react'
import { NetType } from '@helium/crypto-react-native'
import { AppStateStatus, Platform } from 'react-native'
import Box from './Box'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'

const TestnetBanner = ({ appstate }: { appstate: AppStateStatus }) => {
  const { currentAccount } = useAccountStorage()
  const { locked } = useAppStorage()

  const selectedTestnet = useMemo(
    () =>
      currentAccount?.netType === NetType.TESTNET &&
      appstate === 'active' &&
      !locked,
    [appstate, currentAccount, locked],
  )
  return (
    <Box
      position="absolute"
      top={0}
      height={Platform.OS === 'ios' ? 40 : 22}
      width="100%"
      backgroundColor="red500"
      zIndex={1000000}
      visible={selectedTestnet}
    />
  )
}

export default memo(TestnetBanner)
