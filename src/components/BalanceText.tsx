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

  const fractional = useMemo(() => {
    if (amount === undefined) return 0
    const decimal = amount - integral
    const decimalFixed = decimal.toFixed(9)
    const fraction = decimalFixed.toString().split('.')[1]
    const decimalWithoutTrailingZeroes = decimalFixed.replace(/0+$/, '')
    const decimalsLength = decimalWithoutTrailingZeroes
      .toString()
      .split('.')[1].length
    const fractionWithMaxDecimals = fraction?.slice(1, decimalsLength)
    return fraction ? fractionWithMaxDecimals : 0
  }, [amount, integral])

  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-end">
        <Text adjustsFontSizeToFit variant={variant} color="primaryText">
          {`${integral.toLocaleString()}`}
        </Text>
        <Text adjustsFontSizeToFit variant={variant} color="text.placeholder">
          {`.${fractional}`}
        </Text>
      </Box>
    </Box>
  )
}

export default memo(BalanceText)
