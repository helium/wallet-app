import React, { memo, useCallback, useMemo } from 'react'
import Checkmark from '@assets/images/checkIco.svg'
import { useColors } from '@theme/themeHooks'
import Text from './Text'
import Box from './Box'
import AccountIcon from './AccountIcon'
import { ellipsizeAddress, formatAccountAlias } from '../utils/accountUtils'
import { CSAccount } from '../storage/cloudStorage'
import TouchableContainer from './TouchableContainer'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'

type Props = {
  selected: boolean
  account: CSAccount
  onPress?: (account: CSAccount) => void
  disabled?: boolean
}
const AccountListItem = ({
  selected,
  account,
  onPress,
  disabled,
  ...rest
}: Props & BoxProps<Theme>) => {
  const { primaryText } = useColors()

  const handlePress = useCallback(() => onPress?.(account), [account, onPress])

  const address = useMemo(() => {
    return account.solanaAddress
  }, [account])

  return (
    <TouchableContainer
      minHeight={52}
      paddingVertical="4"
      paddingHorizontal="4"
      flexDirection="row"
      alignItems="center"
      borderBottomWidth={2}
      borderColor="primaryBackground"
      onPress={handlePress}
      disabled={disabled}
      {...rest}
    >
      <AccountIcon size={40} address={address} />
      <Box flexDirection="column" justifyContent="center" flex={1}>
        <Text variant="textMdRegular" marginLeft="3" color="primaryText">
          {formatAccountAlias(account)}
        </Text>
        <Text variant="textXsRegular" marginLeft="3" color="secondaryText">
          {ellipsizeAddress(address || '')}
        </Text>
      </Box>
      {selected && (
        <Box
          backgroundColor="primaryBackground"
          height={27}
          width={27}
          borderRadius="full"
          justifyContent="center"
          alignItems="center"
        >
          <Checkmark color={primaryText} />
        </Box>
      )}
    </TouchableContainer>
  )
}

export default memo(AccountListItem)
