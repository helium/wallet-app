import React, { memo, useEffect, useMemo, useState } from 'react'
import AnimatedNumbers from 'react-native-animated-numbers'
import { useTextVariants } from '@config/theme/themeHooks'
import { Easing } from 'react-native-reanimated'
import { useBalance } from '@utils/Balance'
import { useTheme } from '@shopify/restyle'
import Box from './Box'
import Text from './Text'

const TotalFiatBalance = () => {
  const { total: amount } = useBalance()
  const { colors } = useTheme()

  const textVariants = useTextVariants()
  const integral = useMemo(() => Math.floor(amount || 0), [amount])
  const [realAmount, setAmount] = useState(amount || 0)

  const firstFractional = useMemo(() => {
    if (realAmount === undefined) return 0
    const decimal = realAmount - integral
    const fraction = decimal.toString().split('.')[1]
    // Fraction with max length of decimals
    const fractionWithMaxDecimals = fraction?.slice(0, 1)
    return fraction ? Number(fractionWithMaxDecimals) : 0
  }, [realAmount, integral])

  const secondFractional = useMemo(() => {
    if (realAmount === undefined) return 0
    const decimal = realAmount - integral
    const fraction = decimal.toString().split('.')[1]
    // Fraction with max length of decimals
    const fractionWithMaxDecimals = fraction?.slice(1, 2)
    return fraction ? Number(fractionWithMaxDecimals) : 0
  }, [realAmount, integral])

  useEffect(() => {
    if (!amount) return

    setTimeout(() => {
      setAmount(amount)
    }, 3000)
  }, [amount])

  return (
    <Box>
      <Box flexDirection="row" alignItems="flex-end">
        <Text adjustsFontSizeToFit variant="displayLgBold" color="primaryText">
          $
        </Text>
        <AnimatedNumbers
          includeComma
          animateToNumber={realAmount || 0}
          fontStyle={{
            fontSize: textVariants.displayLgBold.fontSize,
            fontWeight: 'bold',
            fontFamily: textVariants.displayLgBold.fontFamily,
          }}
          easing={Easing.elastic(1.2)}
          animationDuration={1400}
        />
        <Text
          adjustsFontSizeToFit
          variant="displayLgBold"
          color="text.placeholder-subtle"
        >
          .
        </Text>
        <AnimatedNumbers
          includeComma
          animateToNumber={firstFractional || 0}
          fontStyle={{
            color: colors['text.placeholder-subtle'],
            fontSize: textVariants.displayLgBold.fontSize,
            fontWeight: 'bold',
            fontFamily: textVariants.displayLgBold.fontFamily,
          }}
        />
        <AnimatedNumbers
          includeComma
          animateToNumber={secondFractional || 0}
          fontStyle={{
            color: colors['text.placeholder-subtle'],
            fontSize: textVariants.displayLgBold.fontSize,
            fontWeight: 'bold',
            fontFamily: textVariants.displayLgBold.fontFamily,
          }}
        />
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

// TODO: Bring this back once we are tracking balances on the wallet api
// const BalanceChange = ({ change }: { change: number }) => {
//   return (
//     <Text adjustsFontSizeToFit variant="textLgSemibold" color="fg.quinary-400">
//       {`$${change.toFixed(2).toLocaleString()}`}
//     </Text>
//   )
// }

// TODO: Bring this back once we are tracking balances on the wallet api
// const PercentageContainer = ({
//   percentage,
//   type,
// }: {
//   percentage: number
//   type: 'up' | 'down' | 'neutral'
// }) => {
//   const backgroundColor = useMemo(() => {
//     switch (type) {
//       case 'up':
//         return 'green.light-500'
//       case 'down':
//         return 'error.500'
//       case 'neutral':
//         return 'fg.quinary-400'
//     }
//   }, [type])

//   return (
//     <Box
//       flexDirection="row"
//       alignItems="flex-end"
//       backgroundColor={backgroundColor}
//       borderRadius="md"
//       paddingHorizontal="xs"
//       paddingVertical="1"
//     >
//       <Text
//         adjustsFontSizeToFit
//         variant="textLgSemibold"
//         color="primaryBackground"
//       >
//         {`+${percentage.toFixed(2)}%`}
//       </Text>
//     </Box>
//   )
// }

export default memo(TotalFiatBalance)
