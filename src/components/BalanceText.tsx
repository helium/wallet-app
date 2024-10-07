import React, { memo, useMemo } from 'react'
import { TextProps } from '@shopify/restyle'
import Box from './Box'
import Text from './Text'
import { locale } from '@utils/i18n'
import { Theme } from '@theme/theme'

const BalanceText = ({
  amount,
  decimals,
  ...rest
}: {
  amount: number | undefined
  decimals: number | undefined
} & TextProps<Theme>) => {
  const integral = useMemo(() => Math.floor(amount || 0), [amount])

  const fractional = useMemo(() => {
    if (amount === undefined) return '-'
    const decimal = amount - integral
    const fraction = decimal.toString().split('.')[1]
    // Fraction with max length of decimals
    const fractionWithMaxDecimals = fraction?.slice(0, decimals)
    return fraction ? '.' + fractionWithMaxDecimals : '.00'
  }, [amount, integral, decimals])

  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-end">
        <Text
          paddingTop="2"
          adjustsFontSizeToFit
          variant="displayLgBold"
          color="primaryText"
          {...rest}
        >
          {`$${integral.toLocaleString(locale)}`}
        </Text>
        <Text
          adjustsFontSizeToFit
          variant="displayLgBold"
          color="text.placeholder-subtle"
        >
          {fractional}
        </Text>
      </Box>
      {/* 
      TODO: Bring this back once we are tracking balances on the wallet api 
      <Box
        flexDirection={'row'}
        justifyContent="center"
        alignItems="center"
        gap="2.5"
        marginTop={'xs'}
      >
        <BalanceChange change={120.0} />
        <PercentageContainer percentage={20.0} type="up" />
      </Box> */}
    </Box>
  )
}

const BalanceChange = ({ change }: { change: number }) => {
  return (
    <Text adjustsFontSizeToFit variant="textLgSemibold" color="fg.quinary-400">
      {`$${change.toFixed(2).toLocaleString()}`}
    </Text>
  )
}

const PercentageContainer = ({
  percentage,
  type,
}: {
  percentage: number
  type: 'up' | 'down' | 'neutral'
}) => {
  const backgroundColor = useMemo(() => {
    switch (type) {
      case 'up':
        return 'green.light-500'
      case 'down':
        return 'error.500'
      case 'neutral':
        return 'fg.quinary-400'
    }
  }, [type])

  return (
    <Box
      flexDirection="row"
      alignItems="flex-end"
      backgroundColor={backgroundColor}
      borderRadius="md"
      paddingHorizontal="xs"
      paddingVertical="1"
    >
      <Text
        adjustsFontSizeToFit
        variant="textLgSemibold"
        color="primaryBackground"
      >
        {`+${percentage.toFixed(2)}%`}
      </Text>
    </Box>
  )
}

export default memo(BalanceText)
