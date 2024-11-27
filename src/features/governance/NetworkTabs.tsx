import Box from '@components/Box'
import { useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import React, { useCallback, useMemo } from 'react'
import SegmentedControl from '@components/SegmentedControl'
import { Mints } from '@utils/constants'
import IOT from '@assets/svgs/iotSymbol.svg'
import MOBILE from '@assets/svgs/mobileIcon.svg'
import HNT from '@assets/svgs/tokenHNT.svg'
import { GovernanceNavigationProp } from './governanceTypes'

export const NetworkTabs: React.FC = () => {
  const navigation = useNavigation<GovernanceNavigationProp>()
  const options = useMemo(
    () => [
      {
        label: 'HNT',
        value: Mints.HNT,
        Icon: HNT,
        iconProps: { width: 20, height: 20 },
      },
      {
        label: 'MOBILE',
        value: Mints.MOBILE,
        Icon: MOBILE,
        iconProps: { width: 20, height: 20 },
      },
      {
        label: 'IOT',
        value: Mints.IOT,
        Icon: IOT,
        iconProps: { width: 20, height: 20 },
      },
    ],
    [],
  )

  const onItemSelected = useCallback(
    (index: number) => {
      const pk = new PublicKey(options[index].value)
      navigation.setParams({ mint: pk.toBase58() })
    },
    [navigation, options],
  )

  return (
    <Box flexDirection="row" justifyContent="center">
      <SegmentedControl
        options={options}
        onItemSelected={onItemSelected}
        backgroundColor="bg.quaternary"
        padding="0.5"
      />
    </Box>
  )
}
