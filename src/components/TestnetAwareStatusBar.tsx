import { NetTypes as NetType } from '@helium/address'
import React, { useMemo } from 'react'
import { StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppState } from '@react-native-community/hooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { Color } from '../theme/theme'
import { useColors, useColorScheme } from '../theme/themeHooks'
import Box from './Box'
import { useOnboarding } from '../features/onboarding/OnboardingProvider'

type Props = { backgroundColor?: Color }
const CustomStatusBar = ({ backgroundColor = 'red500' }: Props) => {
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const theme = useColorScheme()
  const { currentAccount } = useAccountStorage()
  const {
    onboardingData: { netType },
  } = useOnboarding()
  const { locked } = useAppStorage()
  const appState = useAppState()

  const isTestnet = useMemo(
    () =>
      (currentAccount?.netType === NetType.TESTNET ||
        netType === NetType.TESTNET) &&
      appState === 'active' &&
      !locked,
    [appState, currentAccount, locked, netType],
  )
  if (!isTestnet)
    return (
      <StatusBar
        animated
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primaryBackground}
      />
    )

  return (
    <Box
      height={insets.top}
      top={0}
      left={0}
      right={0}
      position="absolute"
      backgroundColor={backgroundColor}
      zIndex={1000000}
    >
      <StatusBar
        animated
        backgroundColor={colors[backgroundColor]}
        barStyle="light-content"
      />
    </Box>
  )
}

export default CustomStatusBar
