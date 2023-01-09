import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Balance, { SolTokens, Ticker } from '@helium/currency'
import { StyleSheet } from 'react-native'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import CarotDown from '../../assets/images/carotDownFull.svg'
import TokenIcon from '../../components/TokenIcon'

export type SwapItemProps = {
  isPaying: boolean
  onCurrencySelect: () => void
  currencySelected: Ticker
  amount: Balance<SolTokens>
  loading?: boolean
} & TouchableOpacityBoxProps

const SwapItem = ({
  isPaying,
  onCurrencySelect,
  currencySelected,
  amount,
  loading = false,
  ...rest
}: SwapItemProps) => {
  const { t } = useTranslation()

  const Pill = useMemo(() => {
    return (
      <TouchableOpacityBox
        height={45}
        borderRadius="round"
        backgroundColor="secondary"
        flexDirection="row"
        alignItems="center"
        shadowColor="black"
        shadowOpacity={0.2}
        shadowOffset={{ width: 0, height: 3 }}
        shadowRadius={3}
        position="absolute"
        top={-22.5}
        onPress={onCurrencySelect}
        padding="s"
      >
        <Box
          marginEnd="xs"
          width={32}
          height={32}
          backgroundColor="black"
          justifyContent="center"
          alignItems="center"
          borderRadius="round"
        >
          <TokenIcon ticker={currencySelected} size={24} />
        </Box>
        <Text variant="subtitle4" color="white" flexGrow={1} textAlign="center">
          {currencySelected}
        </Text>
        <Box marginStart="xs" marginEnd="s" justifyContent="center">
          <CarotDown color="white" width={9} />
        </Box>
      </TouchableOpacityBox>
    )
  }, [currencySelected, onCurrencySelect])
  return (
    <TouchableOpacityBox
      height={120}
      backgroundColor="surfaceSecondary"
      borderRadius="xxl"
      {...rest}
    >
      <Box flex={1} justifyContent="center" alignItems="center">
        {Pill}
        <Text variant="body3" color="secondaryText" marginBottom="xs">
          {isPaying ? t('swapsScreen.youPay') : t('swapsScreen.youReceive')}
        </Text>
        <Box flexDirection="row">
          <Text marginEnd="s" variant="h4">
            {/** If last decimals are zeroes do not show */}
            {!loading
              ? parseFloat(amount.bigBalance.toFixed(8))
              : t('generic.loading')}
          </Text>
          <Text
            variant="h4"
            color="secondaryText"
          >{`${currencySelected}`}</Text>
        </Box>
      </Box>
      {isPaying && (
        <Box
          position="absolute"
          bottom={0}
          backgroundColor="surfaceSecondary"
          alignSelf="center"
          style={styles.rotatedBox}
        />
      )}
    </TouchableOpacityBox>
  )
}

const styles = StyleSheet.create({
  rotatedBox: {
    height: 18,
    width: 18,
    margin: -9,
    transform: [{ rotate: '45deg' }],
  },
})

export default SwapItem
