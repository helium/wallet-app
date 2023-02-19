/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback, useMemo } from 'react'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import { BoxProps } from '@shopify/restyle'
import { Ticker } from '@helium/currency'
import Box from '@components/Box'
import { Theme } from '@theme/theme'
import Text from '@components/Text'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { accountCurrencyType } from '../../utils/accountUtils'

type Props = {
  onChangeTokenType: (ticker: Ticker) => void
  ticker: Ticker
} & BoxProps<Theme>

const TokenTypeItem = ({
  ticker,
  selected,
  onPress,
}: {
  ticker: Ticker
  selected: boolean
  onPress: (ticker: Ticker) => void
}) => {
  const { currentAccount } = useAccountStorage()
  const colors = useColors()
  const color = useCallback(
    (isIcon = true) => {
      const selectedColor =
        ticker === 'MOBILE' && isIcon ? 'blueBright500' : 'primaryText'
      return selected ? selectedColor : 'secondaryIcon'
    },
    [selected, ticker],
  )
  const handlePress = useCallback(() => onPress(ticker), [onPress, ticker])

  const title = useMemo(
    () => accountCurrencyType(currentAccount?.address, ticker).ticker,
    [currentAccount, ticker],
  )

  return (
    <TouchableOpacityBox alignItems="center" onPress={handlePress}>
      {ticker === 'HNT' ? (
        <TokenHNT color={colors[color()]} />
      ) : (
        <TokenMOBILE color={colors[color()]} />
      )}
      <Text variant="body3" marginTop="xs" color={color(false)}>
        {title}
      </Text>
      {selected && (
        <Box
          backgroundColor="primaryText"
          height={3.5}
          width="100%"
          marginTop="ms"
        />
      )}
    </TouchableOpacityBox>
  )
}

const PaymentTypeSelector = ({
  onChangeTokenType,
  ticker: tokenType,
  ...boxProps
}: Props) => {
  return (
    <Box {...boxProps}>
      <Box
        flexDirection="row"
        justifyContent="center"
        borderBottomColor="secondaryIcon"
        borderBottomWidth={1}
      >
        <TokenTypeItem
          ticker="HNT"
          selected={tokenType === 'HNT'}
          onPress={onChangeTokenType}
        />
        <Box marginRight="lx" />
        <TokenTypeItem
          ticker="MOBILE"
          selected={tokenType === 'MOBILE'}
          onPress={onChangeTokenType}
        />
      </Box>
    </Box>
  )
}

export default memo(PaymentTypeSelector)
