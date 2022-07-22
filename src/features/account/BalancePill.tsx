import { NetTypes } from '@helium/address'
import Balance, {
  AnyCurrencyType,
  DataCredits,
  SecurityTokens,
  MobileTokens,
} from '@helium/currency'
import React, { memo, useCallback } from 'react'
import DC from '@assets/images/dc.svg'
import MobileIcon from '@assets/images/mobileIcon.svg'
import Helium from '@assets/images/helium.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { balanceToString } from '../../utils/Balance'
import { useColors } from '../../theme/themeHooks'

type Props = {
  netType: NetTypes.NetType
  balance?: Balance<AnyCurrencyType>
}
const BalancePill = ({ netType, balance }: Props) => {
  const colors = useColors()

  const getIcon = useCallback(() => {
    switch (balance?.type.constructor) {
      case DataCredits:
        return <DC />
      case MobileTokens:
        return (
          <Box marginLeft="n_xs">
            <MobileIcon height={18} width={18} />
          </Box>
        )
      case SecurityTokens:
        return (
          <Box marginLeft="n_xs">
            <Helium color={colors.purple500} />
          </Box>
        )
      default:
        return (
          <Box marginLeft="n_xs">
            <Helium color={colors.blueBright500} />
          </Box>
        )
    }
  }, [balance, colors.blueBright500, colors.purple500])

  if (!balance || balance.integerBalance <= 0) return null

  return (
    <Box
      marginTop="ms"
      borderRadius="xl"
      overflow="hidden"
      backgroundColor={
        netType === NetTypes.TESTNET ? 'lividBrown' : 'surfaceSecondary'
      }
      flexDirection="row"
      alignItems="center"
      paddingVertical="sx"
      paddingHorizontal="ms"
      marginRight="ms"
    >
      {getIcon()}
      <Text variant="body2" marginLeft="sx">
        {balanceToString(balance, {
          maxDecimalPlaces: 2,
          showTicker: false,
        })}
      </Text>
    </Box>
  )
}

export default memo(BalancePill)
