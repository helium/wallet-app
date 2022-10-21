/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback, useMemo } from 'react'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import { BoxProps } from '@shopify/restyle'
import Box from '../../components/Box'
import { Theme } from '../../theme/theme'
import Text from '../../components/Text'
import { useColors } from '../../theme/themeHooks'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { accountCurrencyType } from '../../utils/accountUtils'
import { TokenType } from '../../types/activity'

type Props = {
  onChangeTokenType: (tokenType: TokenType) => void
  tokenType: TokenType
} & BoxProps<Theme>

const TokenTypeItem = ({
  tokenType,
  selected,
  onPress,
}: {
  tokenType: TokenType
  selected: boolean
  onPress: (tokenType: TokenType) => void
}) => {
  const { currentAccount } = useAccountStorage()
  const colors = useColors()
  const color = useCallback(
    (isIcon = true) => {
      const selectedColor =
        tokenType === TokenType.Mobile && isIcon
          ? 'blueBright500'
          : 'primaryText'
      return selected ? selectedColor : 'secondaryIcon'
    },
    [selected, tokenType],
  )
  const handlePress = useCallback(
    () => onPress(tokenType),
    [onPress, tokenType],
  )

  const title = useMemo(
    () => accountCurrencyType(currentAccount?.address, tokenType).ticker,
    [currentAccount, tokenType],
  )

  return (
    <TouchableOpacityBox alignItems="center" onPress={handlePress}>
      {tokenType === TokenType.Hnt ? (
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
  tokenType,
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
          tokenType={TokenType.Hnt}
          selected={tokenType === TokenType.Hnt}
          onPress={onChangeTokenType}
        />
        <Box marginRight="lx" />
        <TokenTypeItem
          tokenType={TokenType.Mobile}
          selected={tokenType === TokenType.Mobile}
          onPress={onChangeTokenType}
        />
      </Box>
    </Box>
  )
}

export default memo(PaymentTypeSelector)
