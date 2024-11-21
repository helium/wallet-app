import React, { memo, useMemo } from 'react'
import { TextVariant } from '@config/theme/theme'
import Box from './Box'
import Text from './Text'

const BalanceText = ({
  amount,
  variant = 'textLgSemibold',
}: {
  amount: number
  variant?: TextVariant
}) => {
  const integral = useMemo(() => Math.floor(amount || 0), [amount])

  const firstFractional = useMemo(() => {
    if (amount === undefined) return 0
    const decimal = amount - integral
    const fraction = decimal.toString().split('.')[1]
    // Fraction with max length of decimals
    const fractionWithMaxDecimals = fraction?.slice(0, 1)
    return fraction ? Number(fractionWithMaxDecimals) : 0
  }, [amount, integral])

  const secondFractional = useMemo(() => {
    if (amount === undefined) return 0
    const decimal = amount - integral
    const fraction = decimal.toString().split('.')[1]
    // Fraction with max length of decimals
    const fractionWithMaxDecimals = fraction?.slice(1, 2)
    return fraction ? Number(fractionWithMaxDecimals) : 0
  }, [amount, integral])

  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-end">
        <Text adjustsFontSizeToFit variant={variant} color="primaryText">
          {`${integral.toLocaleString()}`}
        </Text>
        <Text adjustsFontSizeToFit variant={variant} color="text.placeholder">
          {`.${firstFractional}${secondFractional}`}
        </Text>
      </Box>
    </Box>
  )
}

export default memo(BalanceText)
