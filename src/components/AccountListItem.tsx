import React, { memo, useCallback, useMemo } from 'react'
import Checkmark from '@assets/images/checkIco.svg'
import { useColors } from '@theme/themeHooks'
import Text from './Text'
import Box from './Box'
import AccountIcon from './AccountIcon'
import { ellipsizeAddress, formatAccountAlias } from '../utils/accountUtils'
import { CSAccount } from '../storage/cloudStorage'
import TouchableContainer from './TouchableContainer'

type Props = {
  selected: boolean
  account: CSAccount
  onPress?: (account: CSAccount) => void
  disabled?: boolean
}
const AccountListItem = ({ selected, account, onPress, disabled }: Props) => {
  const { primary } = useColors()

  const handlePress = useCallback(() => onPress?.(account), [account, onPress])

  const address = useMemo(() => {
    return account.solanaAddress
  }, [account])

  return (
    <TouchableContainer
      minHeight={52}
      paddingVertical="m"
      paddingHorizontal="xl"
      flexDirection="row"
      alignItems="center"
      borderBottomWidth={1}
      borderColor="primary"
      onPress={handlePress}
      disabled={disabled}
    >
      <AccountIcon size={40} address={address} />
      <Box flexDirection="column" justifyContent="center" flex={1}>
        <Text variant="body1" marginLeft="ms">
          {formatAccountAlias(account)}
        </Text>
        <Text variant="body3" marginLeft="ms" color="secondaryText">
          {ellipsizeAddress(address || '')}
        </Text>
      </Box>
      {selected && (
        <Box
          backgroundColor="surfaceContrast"
          height={27}
          width={27}
          borderRadius="round"
          justifyContent="center"
          alignItems="center"
        >
          <Checkmark color={primary} />
        </Box>
      )}
    </TouchableContainer>
  )
}

export default memo(AccountListItem)
